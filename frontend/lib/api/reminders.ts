import { api } from "./client";

export interface Reminder {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export interface CreateReminderRequest {
  type?: string;
  title: string;
  description?: string;
  time?: string;
  days?: string[];
}

export interface UpdateReminderRequest {
  title?: string;
  description?: string;
  time?: string;
  days?: string[];
  type?: string;
}

export async function listReminders(): Promise<Reminder[]> {
  return api.get("reminders").json<Reminder[]>();
}

export async function createReminder(
  data: CreateReminderRequest
): Promise<Reminder> {
  return api.post("reminders", { json: data }).json<Reminder>();
}

export async function updateReminder(
  id: string,
  data: UpdateReminderRequest
): Promise<Reminder> {
  return api.patch(`reminders/${id}`, { json: data }).json<Reminder>();
}

export async function toggleReminder(id: string): Promise<Reminder> {
  return api.patch(`reminders/${id}/toggle`).json<Reminder>();
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(`reminders/${id}`);
}
