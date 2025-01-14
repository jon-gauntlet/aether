import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  where,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../auth/AuthProvider';

// TODO: Natural Integration Points
// 1. Space-specific message handling
// 2. Energy-based message delivery
// 3. Flow state protection
// 4. Natural resonance calculation
// 5. Thread energy inheritance
// 6. Reaction resonance patterns
// 7. File energy signatures

const MessageContext = createContext(undefined);

export function BasicMessageProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState({});
  const { user } = useAuth();

  // TODO: Add hooks for:
  // 1. Space context
  // 2. Energy tracking
  // 3. Flow protection
  // 4. Natural presence
  // 5. Thread resonance
  // 6. Emotional patterns
  // 7. File signatures

  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('threadId', '==', null), // Only root messages
      orderBy('timestamp', 'asc')
      // TODO: Add space-specific filtering
      // TODO: Add energy-based message prioritization
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwn: doc.data().userId === user.uid
      }));
      setMessages(newMessages);
      
      // TODO: Add natural message processing:
      // 1. Calculate message resonance
      // 2. Apply space energy effects
      // 3. Handle flow state protection
      // 4. Process natural transitions
      // 5. Calculate thread energy
      // 6. Process reaction patterns
      // 7. Analyze file signatures
    });

    return () => unsubscribe();
  }, [user]);

  // Load thread messages when needed
  const loadThread = async (parentId) => {
    if (!threads[parentId]) {
      const threadsRef = collection(db, 'messages');
      const q = query(
        threadsRef,
        where('threadId', '==', parentId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const threadMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isOwn: doc.data().userId === user.uid
        }));

        setThreads(prev => ({
          ...prev,
          [parentId]: threadMessages
        }));

        // TODO: Calculate thread resonance and energy inheritance
      });

      return unsubscribe;
    }
  };

  const sendMessage = async (text, file = null, threadId = null) => {
    if (!user) return;

    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        // TODO: Calculate file energy signature
        const storageRef = ref(storage, `files/${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fileName = file.name;
      }

      // TODO: Add natural message creation:
      // 1. Calculate initial resonance
      // 2. Apply space energy effects
      // 3. Handle flow protection
      // 4. Add natural transitions
      // 5. Initialize thread energy
      // 6. Set reaction patterns
      // 7. Process file energy

      const messageData = {
        text,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: Timestamp.now(),
        fileUrl,
        fileName,
        threadId,
        reactions: [],
        threadCount: 0,
        // TODO: Add fields for:
        // - spaceType
        // - energyLevel
        // - resonance
        // - flowState
        // - threadEnergy
        // - reactionPatterns
        // - fileSignature
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Update thread count on parent message
      if (threadId) {
        const parentDoc = doc(db, 'messages', threadId);
        await updateDoc(parentDoc, {
          threadCount: (threads[threadId]?.length || 0) + 1
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleReaction = async (messageId, emoji) => {
    if (!user) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId) || 
                     Object.values(threads).flat().find(m => m.id === messageId);
      
      if (!message) return;

      const reaction = message.reactions?.find(r => r.emoji === emoji);
      const userReactionData = {
        userId: user.uid,
        userName: user.displayName,
        timestamp: Timestamp.now()
      };

      if (reaction?.users?.includes(user.uid)) {
        // Remove reaction
        await updateDoc(messageRef, {
          reactions: message.reactions.map(r => 
            r.emoji === emoji 
              ? {
                  ...r,
                  users: r.users.filter(id => id !== user.uid),
                  count: r.count - 1
                }
              : r
          ).filter(r => r.count > 0)
        });
      } else {
        // Add reaction
        await updateDoc(messageRef, {
          reactions: [
            ...(message.reactions || []).filter(r => r.emoji !== emoji),
            {
              emoji,
              users: [...(reaction?.users || []), user.uid],
              count: (reaction?.count || 0) + 1
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <MessageContext.Provider value={{
      messages,
      threads,
      sendMessage,
      loadThread,
      toggleReaction
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
} 