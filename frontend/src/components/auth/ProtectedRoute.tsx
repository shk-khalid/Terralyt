import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useESGStore } from "@/store/esgStore";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'Analyst' | 'Auditor' | 'Administrator'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useESGStore();
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-esg-ivory text-esg-dark">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 text-esg-muted animate-spin" />
          <span className="text-xs font-semibold tracking-wide text-esg-muted animate-pulse">
            Restoring ESG session compliance...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, storing the attempted path in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role is not authorized, redirect to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
