export interface File {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  email?: string; // Added email
  cursor?: {
    lineNumber: number;
    column: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Room {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export enum ViewMode {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR'
}

export interface AIResponse {
  text: string;
  codeSnippet?: string;
}