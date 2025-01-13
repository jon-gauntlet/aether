import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @typedef {'text'|'image'|'file'} MessageType
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} content
 * @property {MessageType} type
 * @property {string[]} attachments
 * @property {Date} timestamp
 * @property {string} senderId
 */

/**
 * @typedef {Object} UseMessagesReturn
 * @property {Message[]} messages
 * @property {boolean} loading
 * @property {function(string, MessageType, string[]): Promise<void>} sendMessage
 */

/**
 * Hook for managing chat messages
 * @param {string} chatId - ID of the chat to manage messages for
 * @returns {UseMessagesReturn}
 */
export function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  /**
   * Send a new message
   * @param {string} content - Message content
   * @param {MessageType} type - Type of message
   * @param {string[]} [attachments=[]] - Optional attachments
   * @returns {Promise<void>}
   */
  const sendMessage = async (content, type, attachments = []) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      content,
      type,
      attachments,
      timestamp: serverTimestamp(),
      senderId: auth.currentUser?.uid
    });
  };

  return {
    messages,
    loading,
    sendMessage
  };
}