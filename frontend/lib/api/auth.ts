import { api } from "./client";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export async function login(email: string, password: string) {
  const data = await api
    .post("auth/login", { json: { email, password } })
    .json<TokenResponse>();

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function register(email: string, password: string) {
  const data = await api
    .post("auth/register", { json: { email, password } })
    .json<TokenResponse>();

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function autoLogin() {
  const data = await api
    .post("auth/auto-login")
    .json<TokenResponse>();

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
