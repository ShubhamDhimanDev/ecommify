import { AuthGuard } from "@/components/layout/AuthGuard";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth={false} redirectIfAuth>
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 mb-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Ecommify</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Admin Panel</p>
          </div>
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
