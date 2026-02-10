import ky, { type BeforeRetryState } from "ky";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const data = await ky
      .post(`${API_URL}/api/v1/auth/refresh`, {
        json: { refresh_token: refresh },
      })
      .json<{ access_token: string; refresh_token: string }>();

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
}

export const api = ky.create({
  prefixUrl: `${API_URL}/api/v1`,
  timeout: 30000,
  retry: {
    limit: 1,
    statusCodes: [401],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("access_token");
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      },
    ],
    beforeRetry: [
      async ({ request }: BeforeRetryState) => {
        const newToken = await refreshToken();
        if (newToken) {
          request.headers.set("Authorization", `Bearer ${newToken}`);
        }
      },
    ],
  },
});
