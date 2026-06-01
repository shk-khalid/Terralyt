from django.db import transaction
from django.contrib.auth import get_user_model, authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tenants.serializers import (
    TenantRegistrationSerializer, 
    UserSerializer, 
    UserCreationSerializer,
    TenantSerializer
)
from tenants.permissions import IsAdminRole

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterTenantView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = TenantRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            with transaction.atomic():
                # 1. Create Tenant
                tenant = Tenant.objects.create(
                    company_name=data['company_name'],
                    industry=data.get('industry', '')
                )

                # 2. Create Admin User
                admin_user = User.objects.create_user(
                    email=data['admin_email'],
                    password=data['password'],
                    full_name=data['admin_name'],
                    role=User.Role.ADMIN,
                    tenant=tenant
                )

            user_data = UserSerializer(admin_user).data

            return Response({
                'user': user_data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"error": "Both email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate
        user = authenticate(email=email, password=password)
        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"error": "This account is inactive."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate tokens
        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        response = Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': user_data
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            'access_token',
            tokens['access'],
            httponly=True,
            samesite='Lax',
            secure=False
        )
        response.set_cookie(
            'refresh_token',
            tokens['refresh'],
            httponly=True,
            samesite='Lax',
            secure=False
        )
        return response


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, *args, **kwargs):
        serializer = UserCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            # Create user inheriting the admin's tenant
            new_user = User.objects.create_user(
                email=data['email'],
                password=data['password'],
                full_name=data['full_name'],
                role=data['role'],
                tenant=request.user.tenant
            )

            user_data = UserSerializer(new_user).data
            return Response(user_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Failed to create user: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from rest_framework_simplejwt.exceptions import TokenError

class CookieTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            response = Response({
                'access': access_token
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                samesite='Lax',
                secure=False
            )
            return response
            
        except TokenError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token', samesite='Lax')
        response.delete_cookie('refresh_token', samesite='Lax')
        return response


from tenants.models import Facility
from tenants.serializers import FacilitySerializer

class FacilityListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        facilities = Facility.objects.filter(tenant=tenant, is_deleted=False)
        serializer = FacilitySerializer(facilities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = FacilitySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FacilityDetailUpdateDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, tenant):
        try:
            return Facility.objects.get(pk=pk, tenant=tenant, is_deleted=False)
        except Facility.DoesNotExist:
            return None

    def get(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        facility = self.get_object(pk, tenant)
        if not facility:
            return Response({"error": "Facility not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = FacilitySerializer(facility)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        facility = self.get_object(pk, tenant)
        if not facility:
            return Response({"error": "Facility not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = FacilitySerializer(facility, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        facility = self.get_object(pk, tenant)
        if not facility:
            return Response({"error": "Facility not found."}, status=status.HTTP_404_NOT_FOUND)
        facility.is_deleted = True
        facility.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(tenant=tenant)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TenantDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = TenantSerializer(tenant)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        # Role-based check: only ADMIN can modify tenant settings
        if request.user.role != 'ADMIN':
            return Response({"error": "Only administrators can modify tenant settings."}, status=status.HTTP_403_FORBIDDEN)
            
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)



