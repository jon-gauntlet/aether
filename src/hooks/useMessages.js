import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebase';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwn: doc.data().userId === 'current-user' // TODO: Replace with actual user ID
      }));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (text) => {
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        text,
        userId: 'current-user', // TODO: Replace with actual user ID
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return { messages, sendMessage };
};