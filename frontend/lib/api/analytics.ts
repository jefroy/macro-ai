import { api } from "./client";
import type { DailyTotals } from "./food";

export async function getRangeTotals(
  start: string,
  end: string
): Promise<DailyTotals[]> {
  return api
    .get("food-log/range", { searchParams: { start, end } })
    .json<DailyTotals[]>();
}
