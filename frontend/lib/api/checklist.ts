import { api } from "./client";

export interface ChecklistItem {
  id: string;
  date: string;
  title: string;
  type: "auto" | "custom";
  checked: boolean;
  auto_check_field: string;
  auto_check_target: number;
}

export interface ChecklistStreak {
  streak: number;
  today_completion: number;
  streak_includes_today: boolean;
}

export async function getChecklist(date?: string): Promise<ChecklistItem[]> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api
    .get("checklist", { searchParams: params })
    .json<ChecklistItem[]>();
}

export async function toggleChecklistItem(
  id: string
): Promise<ChecklistItem> {
  return api.patch(`checklist/${id}/toggle`).json<ChecklistItem>();
}

export async function addChecklistItem(
  title: string,
  date?: string
): Promise<ChecklistItem> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api
    .post("checklist", { json: { title }, searchParams: params })
    .json<ChecklistItem>();
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await api.delete(`checklist/${id}`);
}

export async function getChecklistStreak(): Promise<ChecklistStreak> {
  return api.get("checklist/streak").json<ChecklistStreak>();
}
