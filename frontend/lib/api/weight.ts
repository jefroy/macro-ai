import { api } from "./client";

export interface WeightEntry {
  id: string;
  date: string;
  weight_kg: number;
  note: string;
}

export interface WeightTrend {
  entries: WeightEntry[];
  rolling_avg_7d: number | null;
  change_30d: number | null;
}

export interface LogWeightRequest {
  date?: string;
  weight_kg: number;
  note?: string;
}

export async function logWeight(data: LogWeightRequest): Promise<WeightEntry> {
  return api.post("weight", { json: data }).json<WeightEntry>();
}

export async function getWeightEntries(days = 30): Promise<WeightEntry[]> {
  return api
    .get("weight", { searchParams: { days } })
    .json<WeightEntry[]>();
}

export async function getWeightTrend(days = 30): Promise<WeightTrend> {
  return api
    .get("weight/trend", { searchParams: { days } })
    .json<WeightTrend>();
}

export async function deleteWeightEntry(id: string): Promise<void> {
  await api.delete(`weight/${id}`);
}
