export const TEST_USER = {
  email: "testuser@macroai.dev",
  password: "TestPass123!",
  age: "28",
  height: "178",
  weight: "82.5",
  gender: "male",
  activityLevel: "moderate",
} as const;

export const ROUTES = {
  login: "/login",
  register: "/register",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  log: "/log",
  recipes: "/recipes",
  checklist: "/checklist",
  analytics: "/analytics",
  chat: "/chat",
  profile: "/profile",
  settings: "/settings",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Food Log", href: "/log" },
  { label: "Recipes", href: "/recipes" },
  { label: "Checklist", href: "/checklist" },
  { label: "Analytics", href: "/analytics" },
  { label: "AI Chat", href: "/chat" },
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
] as const;
