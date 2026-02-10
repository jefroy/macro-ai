import { api } from "./client";

export interface AIConfig {
  provider: string;
  model: string;
  has_api_key: boolean;
  base_url: string;
}

export interface AIConfigUpdate {
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
}

export async function getAIConfig(): Promise<AIConfig> {
  return api.get("users/me/ai-config").json<AIConfig>();
}

export async function updateAIConfig(data: AIConfigUpdate): Promise<AIConfig> {
  return api.put("users/me/ai-config", { json: data }).json<AIConfig>();
}
