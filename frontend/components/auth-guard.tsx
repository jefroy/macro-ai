"use client";

import { Loader2 } from "lucide-react";
import { autoLogin } from "@/lib/api/auth";
import { getMe } from "@/lib/api/user";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const SINGLE_USER_MODE =
  process.env.NEXT_PUBLIC_SINGLE_USER_MODE === "true";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const router = useRouter();
  const pathname = usePathname();
  const autoLoginAttempted = useRef(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated && SINGLE_USER_MODE && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true;
      autoLogin()
        .then(() => setAuthenticated(true))
        .catch(() => router.replace("/login"));
      return;
    }

    if (!isAuthenticated && !SINGLE_USER_MODE) {
      router.replace("/login");
      return;
    }

    if (user && !user.has_completed_onboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, user, pathname, router, setAuthenticated]);

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user?.has_completed_onboarding && pathname !== "/onboarding") {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const router = useRouter();
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }

    if (SINGLE_USER_MODE && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true;
      autoLogin()
        .then(() => {
          setAuthenticated(true);
          router.replace("/dashboard");
        })
        .catch(() => {
          // Failed auto-login, stay on guest page
        });
    }
  }, [isAuthenticated, router, setAuthenticated]);

  if (isAuthenticated || (SINGLE_USER_MODE && !autoLoginAttempted.current)) {
    return null;
  }

  return <>{children}</>;
}
