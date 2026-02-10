import { api } from "./client";

export interface DayReport {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
  entry_count: number;
}

export interface TargetComparison {
  average: number;
  target: number;
  percent: number;
  status: "on_track" | "under" | "over";
}

export interface WeeklyReport {
  start_date: string;
  end_date: string;
  days_logged: number;
  daily_breakdown: DayReport[];
  averages: Record<string, number>;
  vs_targets: Record<string, TargetComparison>;
  highlights: { type: string; message: string }[];
  weight_change: number | null;
}

export async function getWeeklyReport(
  endDate?: string
): Promise<WeeklyReport> {
  const params: Record<string, string> = {};
  if (endDate) params.end_date = endDate;
  return api
    .get("reports/weekly", { searchParams: params })
    .json<WeeklyReport>();
}

export async function exportFoodLog(
  start: string,
  end: string
): Promise<void> {
  const response = await api.get("reports/export", {
    searchParams: { start, end, format: "csv" },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `macroai_food_log_${start}_${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAllData(): Promise<void> {
  const response = await api.get("users/me/export");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "macroai_export.json";
  a.click();
  URL.revokeObjectURL(url);
}
