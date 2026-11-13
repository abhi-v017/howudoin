export interface User {
  id: string; // e.g. "abekrox_1971"
  username: string;
  tag: string;
  displayName: string;
  uniqueId: string;
  avatarUrl?: string;
  bio?: string;
  theme?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export type ConversationType = "DIRECT" | "GROUP";

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    username: string;
    tag: string;
    avatarUrl?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "SYSTEM";
  content?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaMimeType?: string;
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    tag: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  avatarUrl?: string;
  creatorId?: string;
  createdAt: string;
  updatedAt: string;
  displayTitle?: string;
  displayAvatar?: string;
  members: ConversationMember[];
  lastMessage?: Message | null;
}

export type CallType = "AUDIO" | "VIDEO";
export type CallStatus = "IDLE" | "CALLING" | "RINGING" | "ONGOING" | "ENDED";

export interface ActiveCall {
  callId: string;
  conversationId: string;
  callType: CallType;
  caller: {
    id: string;
    username: string;
    tag?: string;
  };
  receiverId?: string;
  isIncoming?: boolean;
}
