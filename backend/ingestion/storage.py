import os
import requests
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings

class SupabaseStorage(Storage):
    def __init__(self, bucket_name=None, supabase_url=None, supabase_key=None):
        self.bucket_name = bucket_name or getattr(settings, 'SUPABASE_BUCKET_NAME', 'uploads')
        self.supabase_url = supabase_url or getattr(settings, 'SUPABASE_URL', None)
        self.supabase_key = supabase_key or getattr(settings, 'SUPABASE_KEY', None)
        
        # Parse project reference if we need to build the fallback URL
        if self.supabase_url:
            self.supabase_url = self.supabase_url.rstrip('/')
            self.base_url = f"{self.supabase_url}/storage/v1"
        else:
            self.base_url = None

    def _verify_config(self):
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured in settings / environment variables."
            )
        if not self.base_url:
            self.supabase_url = self.supabase_url.rstrip('/')
            self.base_url = f"{self.supabase_url}/storage/v1"

    def _get_headers(self, content_type=None):
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _open(self, name, mode='rb'):
        self._verify_config()
        url = f"{self.base_url}/object/{self.bucket_name}/{name}"
        response = requests.get(url, headers=self._get_headers())
        if response.status_code == 200:
            return ContentFile(response.content, name=name)
        else:
            raise FileNotFoundError(f"File {name} not found in Supabase bucket {self.bucket_name}: {response.text}")

    def _save(self, name, content):
        self._verify_config()
        
        content_bytes = content.read()
        url = f"{self.base_url}/object/{self.bucket_name}/{name}"
        
        import mimetypes
        content_type = getattr(content, 'content_type', None)
        if not content_type or content_type == "application/octet-stream":
            guessed_type, _ = mimetypes.guess_type(name)
            content_type = guessed_type or "application/octet-stream"
            
        response = requests.post(url, data=content_bytes, headers=self._get_headers(content_type))
        
        if response.status_code == 200:
            return name
        else:
            raise IOError(f"Could not save file {name} to Supabase bucket {self.bucket_name}: {response.status_code} {response.text}")


    def exists(self, name):
        self._verify_config()
        url = f"{self.base_url}/object/info/{self.bucket_name}/{name}"
        response = requests.get(url, headers=self._get_headers())
        return response.status_code == 200

    def get_file_size(self, name):
        """Fetch the stored file size (bytes) from Supabase metadata without downloading content."""
        self._verify_config()
        url = f"{self.base_url}/object/info/{self.bucket_name}/{name}"
        response = requests.get(url, headers=self._get_headers())
        if response.status_code == 200:
            try:
                return response.json().get('size')
            except Exception:
                pass
        return None

    def url(self, name):
        self._verify_config()
        return f"{self.base_url}/object/{self.bucket_name}/{name}"

