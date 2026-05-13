"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CircleAlert } from "lucide-react";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(storeSlug, {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      router.push(`/${storeSlug}`);
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="section-shell p-8">
        <h1 className="display-title mb-2 text-4xl text-foreground">Create Account</h1>
        <p className="mb-8 text-secondary">Join us to start shopping today</p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <CircleAlert className="h-4 w-4 text-red-700" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground"
                placeholder="John"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full rounded-lg border-b border-outline-variant bg-transparent px-0 py-3 text-foreground"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-outline-variant pt-6">
          <p className="text-center text-secondary">
            Already have an account?{" "}
            <Link
              href={`/${storeSlug}/login`}
              className="font-semibold text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
