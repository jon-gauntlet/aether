import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_auth_header():
    """Get the authorization header with the correct JWT format"""
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    if not service_key:
        raise ValueError("SUPABASE_SERVICE_KEY not found in environment")
    return {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json"
    }

def init_storage():
    """Initialize Supabase storage bucket with proper configuration"""
    base_url = os.getenv('SUPABASE_URL', 'http://127.0.0.1:54321')
    
    # Create documents bucket if it doesn't exist
    bucket_data = {
        "id": "documents",
        "name": "Document Storage",
        "public": False,
        "file_size_limit": 52428800,  # 50MB in bytes
        "allowed_mime_types": [
            "application/pdf",
            "text/plain",
            "text/markdown",
            "application/json"
        ]
    }

    try:
        # First check if bucket exists
        response = requests.get(
            f"{base_url}/storage/v1/bucket/documents",
            headers=get_auth_header()
        )
        
        if response.status_code == 200:
            print("✅ Storage bucket already exists")
            return True
            
        # Create bucket if it doesn't exist
        response = requests.post(
            f"{base_url}/storage/v1/bucket",
            headers=get_auth_header(),
            json=bucket_data
        )
        
        if response.status_code == 200:
            print("✅ Storage bucket created successfully")
            return True
        else:
            print(f"❌ Failed to create storage bucket: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Initializing Supabase storage...")
    init_storage() 