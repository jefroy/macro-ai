import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  wsStatus: "connecting" | "connected" | "disconnected";

  setSessionId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  appendToLastMessage: (content: string) => void;
  finalizeLastMessage: () => void;
  setIsStreaming: (value: boolean) => void;
  setWsStatus: (status: "connecting" | "connected" | "disconnected") => void;
  clearChat: () => void;
}

let messageCounter = 0;

export function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export const useChatStore = create<ChatState>((set) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  wsStatus: "disconnected",

  setSessionId: (id) => set({ sessionId: id }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + content };
      }
      return { messages: msgs };
    }),

  finalizeLastMessage: () =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, streaming: false };
      }
      return { messages: msgs, isStreaming: false };
    }),

  setIsStreaming: (value) => set({ isStreaming: value }),

  setWsStatus: (status) => set({ wsStatus: status }),

  clearChat: () => set({ sessionId: null, messages: [], isStreaming: false }),
}));
