import { api } from "./client";

export interface Profile {
  display_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  activity_level: string;
  timezone: string;
}

export interface Targets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
  profile: Profile;
  targets: Targets;
  has_completed_onboarding: boolean;
}

export async function getMe(): Promise<User> {
  return api.get("users/me").json<User>();
}

export async function updateProfile(data: Partial<Profile>): Promise<User> {
  return api.patch("users/me/profile", { json: data }).json<User>();
}

export async function updateTargets(data: Partial<Targets>): Promise<User> {
  return api.patch("users/me/targets", { json: data }).json<User>();
}

export interface TDEERequest {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  activity_level: string;
  goal: string;
}

export interface TDEEResponse {
  tdee: number;
  suggested_targets: Targets;
}

export async function calculateTDEE(data: TDEERequest): Promise<TDEEResponse> {
  return api.post("users/me/calculate-tdee", { json: data }).json<TDEEResponse>();
}

export interface OnboardingData {
  display_name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  gender: string;
  activity_level: string;
  goal: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export async function completeOnboarding(data: OnboardingData): Promise<User> {
  return api.post("users/me/onboarding", { json: data }).json<User>();
}
