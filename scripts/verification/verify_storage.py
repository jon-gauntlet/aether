import requests
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_auth_header() -> Dict[str, str]:
    """Get the authorization header with the correct JWT format"""
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    if not service_key:
        raise ValueError("SUPABASE_SERVICE_KEY not found in environment")
    return {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key
    }

def test_bucket_access() -> Dict[str, Any]:
    """Test basic bucket access"""
    response = requests.get(
        "http://127.0.0.1:54321/storage/v1/bucket",
        headers=get_auth_header()
    )
    return {
        "status": response.status_code,
        "success": response.status_code == 200,
        "data": response.json() if response.status_code == 200 else None
    }

def test_cors() -> Dict[str, Any]:
    """Test CORS configuration"""
    response = requests.options(
        "http://127.0.0.1:54321/storage/v1/object",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type,apikey"
        }
    )
    cors_headers = {
        "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
        "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
        "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
    }
    return {
        "status": response.status_code,
        "success": response.status_code == 204 and cors_headers["Access-Control-Allow-Origin"],
        "headers": cors_headers
    }

def test_upload_policy() -> Dict[str, Any]:
    """Test upload policy configuration"""
    # Create a test file
    with open("test.txt", "w") as f:
        f.write("test content")
    
    try:
        with open("test.txt", "rb") as f:
            response = requests.post(
                "http://127.0.0.1:54321/storage/v1/object/documents/test.txt",
                headers=get_auth_header(),
                files={"file": f}
            )
        return {
            "status": response.status_code,
            "success": response.status_code == 200,
            "data": response.json() if response.status_code == 200 else None
        }
    finally:
        # Cleanup
        os.remove("test.txt")
        if response.status_code == 200:
            requests.delete(
                "http://127.0.0.1:54321/storage/v1/object/documents/test.txt",
                headers=get_auth_header()
            )

def main():
    print("Testing Supabase Storage Configuration...")
    
    # Test bucket access
    print("\n1. Testing bucket access...")
    bucket_result = test_bucket_access()
    print(f"Status: {'✅' if bucket_result['success'] else '❌'}")
    print(f"Response: {json.dumps(bucket_result, indent=2)}")
    
    # Test CORS
    print("\n2. Testing CORS configuration...")
    cors_result = test_cors()
    print(f"Status: {'✅' if cors_result['success'] else '❌'}")
    print(f"Headers: {json.dumps(cors_result['headers'], indent=2)}")
    
    # Test upload policy
    print("\n3. Testing upload policy...")
    upload_result = test_upload_policy()
    print(f"Status: {'✅' if upload_result['success'] else '❌'}")
    print(f"Response: {json.dumps(upload_result, indent=2)}")

if __name__ == "__main__":
    main() 