import { create } from 'zustand';

import { aiService, AIUnavailableError, type AIContext, type AISuggestion, type CalculatedRow } from '@/services/ai';
import { clock } from '@/services/clock';

export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  calculated?: CalculatedRow[];
  suggestion?: AISuggestion;
  /** Suggestions stay open until the student approves or declines them. */
  suggestionState?: 'open' | 'approved' | 'dismissed';
  createdAt: string;
};

type AssistantState = {
  messages: ChatMessage[];
  status: 'idle' | 'thinking' | 'offline';
  /** The question to resend after an outage. */
  pending: string | null;
  ask: (question: string, ctx: AIContext) => Promise<void>;
  retry: (ctx: AIContext) => Promise<void>;
  resolveSuggestion: (messageId: string, state: 'approved' | 'dismissed') => void;
};

let counter = 0;
const id = () => `m${Date.now().toString(36)}${(counter += 1)}`;

/** Hima AI conversation for this session (not stored on the device). */
export const useAssistantStore = create<AssistantState>()((set, get) => ({
  messages: [],
  status: 'idle',
  pending: null,

  ask: async (question, ctx) => {
    const text = question.trim();
    if (!text || get().status === 'thinking') return;
    set((s) => ({
      messages: [...s.messages, { id: id(), role: 'user', text, createdAt: clock.now().toISOString() }],
      status: 'thinking',
      pending: text,
    }));
    try {
      const answer = await aiService.ask(text, ctx);
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: id(),
            role: 'ai',
            text: answer.text,
            calculated: answer.calculated,
            suggestion: answer.suggestion,
            suggestionState: answer.suggestion ? 'open' : undefined,
            createdAt: clock.now().toISOString(),
          },
        ],
        status: 'idle',
        pending: null,
      }));
    } catch (e) {
      set({ status: e instanceof AIUnavailableError ? 'offline' : 'idle' });
    }
  },

  retry: async (ctx) => {
    const question = get().pending;
    if (!question) {
      set({ status: aiService.isOffline() ? 'offline' : 'idle' });
      return;
    }
    // Drop the unanswered question; ask() adds it back.
    set((s) => ({ messages: s.messages.filter((m, i) => !(i === s.messages.length - 1 && m.role === 'user')), status: 'idle' }));
    await get().ask(question, ctx);
  },

  resolveSuggestion: (messageId, state) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === messageId ? { ...m, suggestionState: state } : m)) })),
}));
