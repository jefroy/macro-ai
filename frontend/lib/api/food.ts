import { api } from "./client";

export interface FoodItem {
  id: string;
  name: string;
  brand: string;
  source: string;
  serving_label: string;
  serving_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
}

export interface FoodSearchResponse {
  results: FoodItem[];
  total: number;
}

export async function searchFoods(
  q: string,
  limit = 20,
  offset = 0
): Promise<FoodSearchResponse> {
  return api
    .get("foods/search", { searchParams: { q, limit, offset } })
    .json<FoodSearchResponse>();
}

export interface RecentFood {
  food_name: string;
  food_id: string | null;
  count: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
  serving_label: string;
}

export async function getRecentFoods(limit = 15): Promise<RecentFood[]> {
  return api
    .get("foods/recent", { searchParams: { limit } })
    .json<RecentFood[]>();
}

export async function getFavoriteFoods(): Promise<FoodItem[]> {
  return api.get("foods/favorites").json<FoodItem[]>();
}

export async function toggleFavoriteFood(
  foodId: string
): Promise<{ is_favorite: boolean }> {
  return api
    .post(`foods/${foodId}/favorite`)
    .json<{ is_favorite: boolean }>();
}

export interface CreateFoodRequest {
  name: string;
  brand?: string;
  serving_label?: string;
  serving_grams?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  saturated_fat_g?: number;
}

export async function createFood(data: CreateFoodRequest): Promise<FoodItem> {
  return api.post("foods", { json: data }).json<FoodItem>();
}

export interface FoodLogEntry {
  id: string;
  date: string;
  meal: string;
  food_id: string | null;
  food_name: string;
  serving_label: string;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
}

export interface DailyTotals {
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

export interface LogFoodRequest {
  food_id?: string;
  food_name: string;
  meal: string;
  serving_label: string;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  saturated_fat_g?: number;
}

export async function logFood(data: LogFoodRequest): Promise<FoodLogEntry> {
  return api.post("food-log", { json: data }).json<FoodLogEntry>();
}

export async function getFoodLog(date?: string): Promise<FoodLogEntry[]> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api.get("food-log", { searchParams: params }).json<FoodLogEntry[]>();
}

export async function getDailyTotals(date?: string): Promise<DailyTotals> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api
    .get("food-log/totals", { searchParams: params })
    .json<DailyTotals>();
}

export async function deleteFoodLogEntry(id: string): Promise<void> {
  await api.delete(`food-log/${id}`);
}

export interface CopyMealRequest {
  source_date: string;
  source_meal: string;
  target_date: string;
  target_meal: string;
}

export interface CopyMealResponse {
  copied: number;
  entries: FoodLogEntry[];
}

export async function copyMeal(
  data: CopyMealRequest
): Promise<CopyMealResponse> {
  return api.post("food-log/copy", { json: data }).json<CopyMealResponse>();
}

export interface DailyInsight {
  type: "success" | "warning" | "info";
  message: string;
}

export async function getDailyInsights(
  date?: string
): Promise<DailyInsight[]> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api
    .get("food-log/insights", { searchParams: params })
    .json<DailyInsight[]>();
}

export interface NutrientAlert {
  nutrient: string;
  label: string;
  current: number;
  limit: number;
  unit: string;
  severity: "warning" | "info";
  direction: "over" | "under";
  message: string;
}

export async function getNutrientAlerts(
  date?: string
): Promise<NutrientAlert[]> {
  const params: Record<string, string> = {};
  if (date) params.target_date = date;
  return api
    .get("food-log/alerts", { searchParams: params })
    .json<NutrientAlert[]>();
}
