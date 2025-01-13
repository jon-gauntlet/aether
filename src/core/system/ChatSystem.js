import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  presence?: string;
}

export interface Message {
  id: string;
  channelId: string;
  threadId?: string;
  userId: string;
  content: string;
  timestamp: number;
  edited?: boolean;
  reactions?: { [key: string]: string[] }; // emoji: userIds[]
  files?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  members: string[];
  lastActivity: number;
  description?: string;
}

export interface Thread {
  id: string;
  channelId: string;
  parentMessageId: string;
  lastActivity: number;
}

export interface ChatState {
  users: User[];
  channels: Channel[];
  messages: Message[];
  threads: Thread[];
  activeChannel?: string;
  activeThread?: string;
}

export class ChatSystem {
  private chatState$ = new BehaviorSubject<ChatState>({
    users: [],
    channels: [],
    messages: [],
    threads: []
  });

  // Real-time message handling
  public sendMessage(channelId: string, userId: string, content: string, threadId?: string, files?: Message['files']): void {
    const message: Message = {
      id: uuidv4(),
      channelId,
      threadId,
      userId,
      content,
      timestamp: Date.now(),
      files
    };

    const currentState = this.chatState$.value;
    this.chatState$.next({
      ...currentState,
      messages: [...currentState.messages, message]
    });

    // Update channel/thread activity
    this.updateActivity(channelId, threadId);
  }

  public editMessage(messageId: string, newContent: string): void {
    const currentState = this.chatState$.value;
    const messageIndex = currentState.messages.findIndex(m => m.id === messageId);
    
    if (messageIndex >= 0) {
      const updatedMessages = [...currentState.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
        edited: true
      };

      this.chatState$.next({
        ...currentState,
        messages: updatedMessages
      });
    }
  }

  // Channel management
  public createChannel(name: string, type: Channel['type'], members: string[], description?: string): string {
    const channel: Channel = {
      id: uuidv4(),
      name,
      type,
      members,
      lastActivity: Date.now(),
      description
    };

    const currentState = this.chatState$.value;
    this.chatState$.next({
      ...currentState,
      channels: [...currentState.channels, channel]
    });

    return channel.id;
  }

  public joinChannel(channelId: string, userId: string): void {
    const currentState = this.chatState$.value;
    const channelIndex = currentState.channels.findIndex(c => c.id === channelId);

    if (channelIndex >= 0 && !currentState.channels[channelIndex].members.includes(userId)) {
      const updatedChannels = [...currentState.channels];
      updatedChannels[channelIndex] = {
        ...updatedChannels[channelIndex],
        members: [...updatedChannels[channelIndex].members, userId]
      };

      this.chatState$.next({
        ...currentState,
        channels: updatedChannels
      });
    }
  }

  // Thread management
  public createThread(channelId: string, parentMessageId: string): string {
    const thread: Thread = {
      id: uuidv4(),
      channelId,
      parentMessageId,
      lastActivity: Date.now()
    };

    const currentState = this.chatState$.value;
    this.chatState$.next({
      ...currentState,
      threads: [...currentState.threads, thread]
    });

    return thread.id;
  }

  // Reactions
  public toggleReaction(messageId: string, userId: string, emoji: string): void {
    const currentState = this.chatState$.value;
    const messageIndex = currentState.messages.findIndex(m => m.id === messageId);

    if (messageIndex >= 0) {
      const message = currentState.messages[messageIndex];
      const reactions = message.reactions || {};
      const users = reactions[emoji] || [];
      
      const updatedUsers = users.includes(userId)
        ? users.filter(id => id !== userId)
        : [...users, userId];

      const updatedMessages = [...currentState.messages];
      updatedMessages[messageIndex] = {
        ...message,
        reactions: {
          ...reactions,
          [emoji]: updatedUsers
        }
      };

      this.chatState$.next({
        ...currentState,
        messages: updatedMessages
      });
    }
  }

  // User presence
  public updateUserStatus(userId: string, status: User['status'], presence?: string): void {
    const currentState = this.chatState$.value;
    const userIndex = currentState.users.findIndex(u => u.id === userId);

    if (userIndex >= 0) {
      const updatedUsers = [...currentState.users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        status,
        presence
      };

      this.chatState$.next({
        ...currentState,
        users: updatedUsers
      });
    }
  }

  // Activity tracking
  private updateActivity(channelId: string, threadId?: string): void {
    const currentState = this.chatState$.value;
    const channelIndex = currentState.channels.findIndex(c => c.id === channelId);
    
    if (channelIndex >= 0) {
      const updatedChannels = [...currentState.channels];
      updatedChannels[channelIndex] = {
        ...updatedChannels[channelIndex],
        lastActivity: Date.now()
      };

      if (threadId) {
        const threadIndex = currentState.threads.findIndex(t => t.id === threadId);
        if (threadIndex >= 0) {
          const updatedThreads = [...currentState.threads];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            lastActivity: Date.now()
          };

          this.chatState$.next({
            ...currentState,
            channels: updatedChannels,
            threads: updatedThreads
          });
          return;
        }
      }

      this.chatState$.next({
        ...currentState,
        channels: updatedChannels
      });
    }
  }

  // State observers
  public observeChat(): Observable<ChatState> {
    return this.chatState$.asObservable();
  }

  public observeChannel(channelId: string): Observable<Message[]> {
    return this.chatState$.pipe(
      map(state => state.messages.filter(m => m.channelId === channelId && !m.threadId)),
      distinctUntilChanged()
    );
  }

  public observeThread(threadId: string): Observable<Message[]> {
    return this.chatState$.pipe(
      map(state => state.messages.filter(m => m.threadId === threadId)),
      distinctUntilChanged()
    );
  }

  public observeUserPresence(userId: string): Observable<User | undefined> {
    return this.chatState$.pipe(
      map(state => state.users.find(u => u.id === userId)),
      distinctUntilChanged()
    );
  }

  // Search functionality
  public searchMessages(query: string): Message[] {
    const normalizedQuery = query.toLowerCase();
    return this.chatState$.value.messages.filter(
      message => message.content.toLowerCase().includes(normalizedQuery)
    );
  }
} 