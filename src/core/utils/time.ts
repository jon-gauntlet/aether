import { Timestamp } from 'firebase/firestore';

export function formatTimestamp(timestamp: Timestamp | Date | null): string {
  if (!timestamp) return '';

  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
} 