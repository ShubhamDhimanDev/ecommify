"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);
    try {
      await authApi.updateMe(profileForm);
      await refreshUser();
      setProfileSuccess("Profile updated.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setProfileError(e.message ?? "Update failed.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwErrors({});
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm);
      setPwSuccess("Password changed. All other sessions have been revoked.");
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setPwErrors(flat);
      } else {
        setPwError(e.message ?? "Failed.");
      }
    } finally {
      setPwLoading(false);
    }
  }

  async function handleResendVerification() {
    try {
      await authApi.resendVerification();
      alert("Verification email sent.");
    } catch {}
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-zinc-900">{user?.name}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              {user?.email_verified_at ? (
                <span className="text-xs text-green-600 font-medium">✓ Email verified</span>
              ) : (
                <>
                  <span className="text-xs text-amber-600 font-medium">Email not verified</span>
                  <button
                    onClick={handleResendVerification}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Resend
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-zinc-400 border-t border-zinc-100 pt-3">
          Member since {formatDate(user?.created_at ?? null)} ·
          Last login {formatDate(user?.last_login_at ?? null)} ·
          Roles: {user?.roles.join(", ") || "—"}
        </div>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
        </CardHeader>
        {profileError && <Alert variant="error" className="mb-4">{profileError}</Alert>}
        {profileSuccess && <Alert variant="success" className="mb-4">{profileSuccess}</Alert>}
        <form onSubmit={handleProfile} className="space-y-4">
          <Input
            label="Full name"
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Phone number"
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+1 555 000 0000"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>Save changes</Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        {pwError && <Alert variant="error" className="mb-4">{pwError}</Alert>}
        {pwSuccess && <Alert variant="success" className="mb-4">{pwSuccess}</Alert>}
        <form onSubmit={handlePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={pwForm.current_password}
            onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
            error={pwErrors.current_password}
            required
          />
          <Input
            label="New password"
            type="password"
            value={pwForm.password}
            onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
            error={pwErrors.password}
            placeholder="Min 8 characters"
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={pwForm.password_confirmation}
            onChange={(e) => setPwForm((p) => ({ ...p, password_confirmation: e.target.value }))}
            error={pwErrors.password_confirmation}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={pwLoading}>Update password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
