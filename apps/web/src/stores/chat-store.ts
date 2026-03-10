'use client';

import { create } from 'zustand';

export type ChatMessageType =
  | 'text'
  | 'choices'
  | 'image'
  | 'streaming'
  | 'loading';

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  type: ChatMessageType;
  choices?: string[];
  answered?: boolean;
  imageUrl?: string;
}

export type ChatStep =
  | 'welcome'
  | 'collect_name_early'
  | 'pitch_videos'
  | 'pitch_difficulty'
  | 'pitch_solution'
  | 'pitch_cta'
  | 'choose_path'
  | 'collect_topic'
  | 'collect_title'
  | 'collect_subtitle'
  | 'collect_briefing_custom'
  | 'ai_planning_streaming'
  | 'ai_planning_approval'
  | 'collect_author'
  | 'collect_email'
  | 'collect_phone'
  | 'transitioning'
  | 'creating_account'
  | 'creating_book'
  | 'generating_preview'
  | 'preview_ready'
  | 'redirect'
  | 'email_exists';

export type ChatPath = 'generate' | 'custom' | null;

interface ChatState {
  step: ChatStep;
  messages: ChatMessage[];
  path: ChatPath;
  briefing: string;
  title: string;
  subtitle: string;
  authorName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookId: string | null;
  aiPlanningText: string | null;
  error: string | null;
  isProcessing: boolean;
}

interface ChatActions {
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  answerMessage: (id: string) => void;
  removeMessage: (id: string) => void;
  setStep: (step: ChatStep) => void;
  setPath: (path: ChatPath) => void;
  setField: (field: keyof ChatState, value: string | null) => void;
  updateMessageContent: (id: string, content: string) => void;
  updateMessageType: (id: string, type: ChatMessageType) => void;
  setAiPlanningText: (text: string | null) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ChatState = {
  step: 'welcome',
  messages: [],
  path: null,
  briefing: '',
  title: '',
  subtitle: '',
  authorName: '',
  userName: '',
  userEmail: '',
  userPhone: '',
  bookId: null,
  aiPlanningText: null,
  error: null,
  isProcessing: false,
};

let messageCounter = 0;

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
  ...initialState,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `msg-${++messageCounter}` },
      ],
    })),

  answerMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, answered: true } : m,
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  setStep: (step) => set({ step }),

  setPath: (path) => set({ path }),

  setField: (field, value) => set({ [field]: value } as Partial<ChatState>),

  updateMessageContent: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m,
      ),
    })),

  updateMessageType: (id, type) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, type } : m,
      ),
    })),

  setAiPlanningText: (aiPlanningText) => set({ aiPlanningText }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),

  reset: () => {
    messageCounter = 0;
    set(initialState);
  },
}));
