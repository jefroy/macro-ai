import { api } from "./client";

export interface RecipeIngredient {
  food_id: string;
  food_name: string;
  quantity: number;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
}

export interface NutrientTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  total: NutrientTotals;
  per_serving: NutrientTotals;
}

export interface IngredientInput {
  food_id: string;
  quantity: number;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  servings: number;
  ingredients: IngredientInput[];
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  servings?: number;
  ingredients?: IngredientInput[];
}

export interface LogRecipeRequest {
  meal: string;
  servings: number;
  date?: string;
}

export async function listRecipes(): Promise<Recipe[]> {
  return api.get("recipes").json<Recipe[]>();
}

export async function getRecipe(id: string): Promise<Recipe> {
  return api.get(`recipes/${id}`).json<Recipe>();
}

export async function createRecipe(
  data: CreateRecipeRequest
): Promise<Recipe> {
  return api.post("recipes", { json: data }).json<Recipe>();
}

export async function updateRecipe(
  id: string,
  data: UpdateRecipeRequest
): Promise<Recipe> {
  return api.patch(`recipes/${id}`, { json: data }).json<Recipe>();
}

export async function deleteRecipe(id: string): Promise<void> {
  await api.delete(`recipes/${id}`);
}

export async function logRecipe(
  id: string,
  data: LogRecipeRequest
): Promise<void> {
  await api.post(`recipes/${id}/log`, { json: data });
}
