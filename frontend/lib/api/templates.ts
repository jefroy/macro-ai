import { api } from "./client";

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  goal_type: string;
  calories_adjustment: number;
  protein_per_kg: number;
  fat_pct: number;
  suggested_foods: string[];
  tips: string[];
}

export interface ApplyTemplateResponse {
  template_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  message: string;
}

export async function listTemplates(): Promise<GoalTemplate[]> {
  return api.get("templates").json<GoalTemplate[]>();
}

export async function applyTemplate(
  templateId: string
): Promise<ApplyTemplateResponse> {
  return api
    .post(`templates/${templateId}/apply`)
    .json<ApplyTemplateResponse>();
}
