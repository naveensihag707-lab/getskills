export interface Location {
  city: string;
  state: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  location: Location;
  skillsOffered: string[];
  skillsWanted: string[];
  level: string;
  bio: string;
  rating: number;
  reviewCount: number;
  avatar: string;
  isVerified: boolean;
  blockedUsers: string[]; // IDs of blocked users
  password?: string; // Hashed password
  role: 'admin' | 'user';
  lastLogin?: string; // ISO timestamp
}

export interface Session {
  id: string;
  users: string[]; // IDs
  skillTaught: string;
  skillLearned: string;
  date: string;
  time: string;
  status: 'pending' | 'completed';
  rating?: number;
  feedback?: string;
  meetingLink?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isMeetingLink?: boolean;
}

export interface MatchResult {
  userId: string;
  score: number;
  explanation: string;
  isNearby: boolean;
}
