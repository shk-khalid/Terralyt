import csv
import io
import requests
from django.conf import settings

def download_file(file_url):
    """
    Downloads file content from a given URL or reads it from the local filesystem.
    If the URL points to Supabase storage, attaches required authorization headers.
    """
    # Handle local file:// schema or raw filesystem path
    if file_url.startswith("file://"):
        file_path = file_url.replace("file://", "", 1)
        if file_path.startswith("localhost"):
            file_path = file_path.replace("localhost", "", 1)
        with open(file_path, "rb") as f:
            return f.read()

    if not (file_url.startswith("http://") or file_url.startswith("https://")):
        with open(file_url, "rb") as f:
            return f.read()

    # Handle remote HTTP/HTTPS URLs
    headers = {}
    supabase_url = getattr(settings, "SUPABASE_URL", None)
    supabase_key = getattr(settings, "SUPABASE_KEY", None)

    if supabase_url and supabase_key and supabase_url in file_url:
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
        }

    response = requests.get(file_url, headers=headers)
    response.raise_for_status()
    return response.content


def fetch_and_parse_csv(file_url):
    """
    Downloads a CSV file and parses it into a list of dictionaries.
    Attempts utf-8-sig first, falling back to latin-1 for compatibility.
    """
    content = download_file(file_url)
    try:
        decoded_content = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded_content = content.decode("latin-1")
    
    # Normalize line endings to prevent "new-line character seen in unquoted field" error
    normalized_content = decoded_content.replace("\r\n", "\n").replace("\r", "\n")
    
    csv_file = io.StringIO(normalized_content, newline='')
    reader = csv.DictReader(csv_file)
    return [row for row in reader]

