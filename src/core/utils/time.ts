import { Timestamp } from 'firebase/firestore';

export function formatTimestamp(timestamp: Timestamp | null): string {
  if (!timestamp) {
    return '';
  }

  const date = timestamp.toDate();
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    // Format as relative time for last 24 hours
    if (diffInHours < 1) {
      return 'Just now';
    }
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}