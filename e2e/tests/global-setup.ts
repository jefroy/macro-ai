import { chromium, type FullConfig } from "@playwright/test";

/**
 * Global setup: verifies the app is running before tests start.
 * The test user is created as part of Suite 1 (T1.1 + T1.2).
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
  const backendURL = "http://localhost:8000";

  console.log("🔍 Checking frontend at", baseURL);
  console.log("🔍 Checking backend at", backendURL);

  // Check frontend is reachable
  try {
    const res = await fetch(baseURL, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      throw new Error(`Frontend returned ${res.status}`);
    }
    console.log("✅ Frontend is running");
  } catch (e) {
    console.error("❌ Frontend not reachable at", baseURL);
    console.error("   Run: docker compose -f docker-compose.dev.yml up -d");
    process.exit(1);
  }

  // Check backend health
  try {
    const res = await fetch(`${backendURL}/api/docs`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }
    console.log("✅ Backend is running");
  } catch (e) {
    console.error("❌ Backend not reachable at", backendURL);
    console.error("   Run: docker compose -f docker-compose.dev.yml up -d");
    process.exit(1);
  }
}

export default globalSetup;
