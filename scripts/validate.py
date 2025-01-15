import os
from dotenv import load_dotenv
from anthropic import Anthropic

def main():
    load_dotenv()
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not found")
    
    try:
        client = Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Say hello!"}]
        )
        print("API test successful!")
        print("Response:", message.content)
    except Exception as e:
        print("Error connecting to Anthropic API:", e)
        raise

if __name__ == "__main__":
    main() 