import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';
import { Message, MessageType } from '../core/types/chat';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, attachments?: string[]) => Promise<void>;
}

export function useMessages(chatId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          attachments: doc.data().attachments || []
        } as Message));
        
        setMessages(newMessages);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (content: string, attachments: string[] = []) => {
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        content,
        attachments,
        type: MessageType.TEXT,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      setError(err as Error);
    }
  };

  return { messages, loading, error, sendMessage };
}