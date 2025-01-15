#!/usr/bin/env python3
import asyncio
import os
from dotenv import load_dotenv
from rag_aether.data.firebase_adapter import FirebaseAdapter

async def validate_firebase():
    print("\n🔍 Validating Firebase Connection and Data...")
    
    try:
        # Initialize Firebase
        print("\n1. Testing Firebase Connection...")
        adapter = FirebaseAdapter()
        print("✅ Firebase connection successful!")
        
        # Get conversations
        print("\n2. Fetching Conversations...")
        conversations = await adapter.get_conversations()
        print(f"✅ Found {len(conversations)} conversations")
        
        # Check for specific users
        target_users = ["jdycaico@tutanota.com", "zippo8642@gmail.com"]
        found_conversations = []
        
        print("\n3. Checking for Target Users...")
        for doc in conversations:
            participants = doc.metadata.get('participants', [])
            if any(user in participants for user in target_users):
                found_conversations.append(doc)
        
        print(f"✅ Found {len(found_conversations)} conversations with target users")
        
        # Display conversation details
        print("\n4. Conversation Details:")
        for i, doc in enumerate(found_conversations, 1):
            print(f"\nConversation {i}:")
            print(f"ID: {doc.metadata['conversation_id']}")
            print(f"Title: {doc.metadata['title']}")
            print(f"Participants: {', '.join(doc.metadata['participants'])}")
            print(f"Content Preview: {doc.page_content[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Validation failed: {str(e)}")
        return False

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(validate_firebase()) 