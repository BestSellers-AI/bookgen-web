'use client';

import { create } from 'zustand';

export type ChatMessageType =
  | 'text'
  | 'choices'
  | 'image'
  | 'planning'
  | 'loading';

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  type: ChatMessageType;
  choices?: string[];
  planning?: {
    title: string;
    subtitle?: string;
    chapters: Array<{ title: string }>;
  };
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
  | 'collect_author'
  | 'collect_email'
  | 'collect_phone'
  | 'creating_account'
  | 'creating_book'
  | 'generating_preview'
  | 'preview_ready'
  | 'redirect';

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
  error: string | null;
  isProcessing: boolean;
}

interface ChatActions {
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  removeMessage: (id: string) => void;
  setStep: (step: ChatStep) => void;
  setPath: (path: ChatPath) => void;
  setField: (field: keyof ChatState, value: string | null) => void;
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

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  setStep: (step) => set({ step }),

  setPath: (path) => set({ path }),

  setField: (field, value) => set({ [field]: value } as Partial<ChatState>),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),

  reset: () => {
    messageCounter = 0;
    set(initialState);
  },
}));
