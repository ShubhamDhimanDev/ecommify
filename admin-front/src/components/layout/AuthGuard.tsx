"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean; // default true — redirect to /login if unauthenticated
  redirectIfAuth?: boolean; // redirect to /dashboard if already authenticated
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectIfAuth = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (requireAuth && !isAuthenticated) {
      router.replace("/login");
    }
    if (redirectIfAuth && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectIfAuth, router]);

  // Only block rendering (show spinner) when we MUST confirm auth before showing content.
  // Auth pages (requireAuth=false) render immediately — redirect fires in the background.
  if (isLoading && requireAuth) return <FullPageSpinner />;
  if (!isLoading && requireAuth && !isAuthenticated) return null;
  if (!isLoading && redirectIfAuth && isAuthenticated) return null;

  return <>{children}</>;
}
