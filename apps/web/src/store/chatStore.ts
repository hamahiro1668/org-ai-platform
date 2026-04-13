import { create } from 'zustand';
import type { ChatSession, Message } from '@org-ai/shared-types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  pendingDepartment: string | null;
  selectedAgentId: string | null;
  streamingContent: string | null;
  streamingDepartment: string | null;
  autoCreateSession: boolean;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setPendingDepartment: (dept: string | null) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setStreamingContent: (content: string | null) => void;
  appendStreamingContent: (token: string) => void;
  setStreamingDepartment: (dept: string | null) => void;
  setAutoCreateSession: (val: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  pendingDepartment: null,
  selectedAgentId: null,
  streamingContent: null,
  streamingDepartment: null,
  autoCreateSession: false,
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (id) => set({ currentSessionId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setPendingDepartment: (dept) => set({ pendingDepartment: dept }),
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (token) => set((state) => ({
    streamingContent: (state.streamingContent ?? '') + token,
  })),
  setStreamingDepartment: (dept) => set({ streamingDepartment: dept }),
  setAutoCreateSession: (val) => set({ autoCreateSession: val }),
}));
