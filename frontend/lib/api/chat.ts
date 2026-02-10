import { api } from "./client";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function listSessions(): Promise<ChatSession[]> {
  return api.get("chat/sessions").json<ChatSession[]>();
}

export async function createSession(
  title: string = "New Chat"
): Promise<ChatSession> {
  return api.post("chat/sessions", { json: { title } }).json<ChatSession>();
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`chat/sessions/${id}`);
}

export async function getSessionMessages(id: string): Promise<ChatMessage[]> {
  return api.get(`chat/sessions/${id}/messages`).json<ChatMessage[]>();
}
