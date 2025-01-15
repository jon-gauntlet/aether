import os
from pathlib import Path
from dotenv import load_dotenv
from anthropic import Anthropic
import time

# Force reload environment variables
load_dotenv(override=True)

def test_anthropic_services():
    """Test Anthropic API services to validate access levels."""
    
    # Debug environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    print("\n=== Environment Debug ===")
    print(f"API Key prefix: {api_key[:15]}..." if api_key else "API Key: None")
    
    if not api_key or not api_key.startswith("sk-ant-"):
        print("⚠️  Warning: API key doesn't match expected Anthropic format")
        return
        
    client = Anthropic(
        api_key=api_key
    )

    results = {}
    
    # Test 1: Basic API Connection with Claude
    print("\n1. Testing Basic API Connection with Claude...")
    try:
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": "What is 2+2?"
            }]
        )
        print("✓ Successfully connected to Anthropic API")
        print(f"Response: {response.content[0].text}")
        results['basic_connection'] = True
    except Exception as e:
        print(f"✗ Connection failed: {str(e)}")
        results['basic_connection'] = False

    # Test 2: Longer Context
    print("\n2. Testing Longer Context Handling...")
    try:
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": "Explain how a RAG system works in 3 sentences."
            }]
        )
        print("✓ Successfully handled longer context")
        print(f"Response: {response.content[0].text}")
        results['longer_context'] = True
    except Exception as e:
        print(f"✗ Longer context failed: {str(e)}")
        results['longer_context'] = False

    # Test 3: System Messages
    print("\n3. Testing System Messages...")
    try:
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=50,
            system="You are a helpful AI assistant focused on technical documentation.",
            messages=[{
                "role": "user",
                "content": "What is Python?"
            }]
        )
        print("✓ Successfully used system messages")
        print(f"Response: {response.content[0].text}")
        results['system_messages'] = True
    except Exception as e:
        print(f"✗ System messages failed: {str(e)}")
        results['system_messages'] = False

    # Summary
    print("\n=== Summary of Anthropic API Access ===")
    for service, success in results.items():
        print(f"{service}: {'✓' if success else '✗'}")

    return results

if __name__ == "__main__":
    test_anthropic_services() 