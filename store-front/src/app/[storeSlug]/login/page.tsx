"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CircleAlert, KeyRound, Mail } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await login(storeSlug, formData.email, formData.password);
      router.push(`/${storeSlug}`);
    } catch (err) {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="section-shell p-8">
        <h1 className="display-title mb-2 text-4xl text-foreground">Login</h1>
        <p className="mb-8 text-secondary">Sign in to your account to continue shopping</p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <CircleAlert className="h-4 w-4 text-red-700" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground placeholder:text-secondary/70 focus:border-primary focus:outline-none"
              placeholder="you@example.com"
            />
            <Mail className="-mt-8 ml-auto h-4 w-4 text-secondary" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground placeholder:text-secondary/70 focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
            <KeyRound className="-mt-8 ml-auto h-4 w-4 text-secondary" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-outline-variant pt-6">
          <p className="text-center text-secondary">
            Don't have an account?{" "}
            <Link
              href={`/${storeSlug}/register`}
              className="font-semibold text-foreground hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-secondary hover:text-foreground">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}
