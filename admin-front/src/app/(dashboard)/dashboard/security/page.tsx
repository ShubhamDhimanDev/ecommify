"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, ShieldOff, RefreshCw, Copy, Check } from "lucide-react";
import { twoFactorApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  // Enable 2FA
  const [enableData, setEnableData] = useState<{
    qr_code: string;
    secret: string;
    recovery_codes: string[];
  } | null>(null);
  const [enableLoading, setEnableLoading] = useState(false);

  // Confirm 2FA
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Disable 2FA
  const [disableModal, setDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  const [message, setMessage] = useState("");

  // Load recovery codes if 2FA is enabled
  const loadRecoveryCodes = useCallback(async () => {
    if (!user?.two_factor_enabled) return;
    setLoadingCodes(true);
    try {
      const res = await twoFactorApi.recoveryCodes();
      setRecoveryCodes(res.recovery_codes);
    } catch {}
    finally { setLoadingCodes(false); }
  }, [user?.two_factor_enabled]);

  useEffect(() => { loadRecoveryCodes(); }, [loadRecoveryCodes]);

  async function handleEnable() {
    setEnableLoading(true);
    setMessage("");
    try {
      const data = await twoFactorApi.enable();
      setEnableData(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e.message ?? "Failed to enable 2FA.");
    } finally {
      setEnableLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setConfirmError("");
    setConfirmLoading(true);
    try {
      await twoFactorApi.confirm(confirmCode);
      await refreshUser();
      setEnableData(null);
      setConfirmCode("");
      setMessage("Two-factor authentication enabled successfully.");
      loadRecoveryCodes();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setConfirmError(e.message ?? "Invalid code.");
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleDisable() {
    setDisableError("");
    setDisableLoading(true);
    try {
      await twoFactorApi.disable(disablePassword);
      await refreshUser();
      setDisableModal(false);
      setDisablePassword("");
      setRecoveryCodes([]);
      setMessage("Two-factor authentication disabled.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setDisableError(e.message ?? "Failed.");
    } finally {
      setDisableLoading(false);
    }
  }

  async function handleRegenerateCodes() {
    try {
      const res = await twoFactorApi.regenerateRecoveryCodes();
      setRecoveryCodes(res.recovery_codes);
      setMessage("Recovery codes regenerated. Save them somewhere safe.");
    } catch {}
  }

  function copyAll() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {message && (
        <Alert variant="success" className="mb-2">{message}</Alert>
      )}

      {/* 2FA Status card */}
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <div className="flex items-center gap-1.5">
            {user?.two_factor_enabled ? (
              <>
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">Enabled</span>
              </>
            ) : (
              <>
                <ShieldOff className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-500">Disabled</span>
              </>
            )}
          </div>
        </CardHeader>

        <p className="text-sm text-zinc-500 mb-4">
          {user?.two_factor_enabled
            ? "Your account is protected with TOTP two-factor authentication."
            : "Add an extra layer of security by requiring a TOTP code from your authenticator app on login."}
        </p>

        {!user?.two_factor_enabled && !enableData && (
          <Button onClick={handleEnable} loading={enableLoading}>
            Enable two-factor authentication
          </Button>
        )}

        {user?.two_factor_enabled && (
          <Button variant="danger" onClick={() => setDisableModal(true)}>
            Disable two-factor authentication
          </Button>
        )}
      </Card>

      {/* QR Code / Setup step */}
      {enableData && !user?.two_factor_enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR code</CardTitle>
          </CardHeader>
          <p className="text-sm text-zinc-500 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
          </p>
          <div
            className="mb-4 flex justify-center p-4 bg-white border border-zinc-200 rounded-lg w-fit mx-auto"
            dangerouslySetInnerHTML={{ __html: enableData.qr_code }}
          />
          <div className="mb-4 rounded-lg bg-zinc-50 px-4 py-2.5 border border-zinc-200">
            <p className="text-xs text-zinc-500 mb-1">Manual setup code</p>
            <p className="font-mono text-sm text-zinc-800 break-all">{enableData.secret}</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <Input
              label="Enter code from your app to confirm"
              value={confirmCode}
              onChange={(e) => { setConfirmCode(e.target.value); setConfirmError(""); }}
              error={confirmError}
              placeholder="123456"
              maxLength={8}
              required
            />
            <Button type="submit" loading={confirmLoading}>Confirm & enable</Button>
          </form>
        </Card>
      )}

      {/* Recovery codes */}
      {user?.two_factor_enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery codes</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyAll}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy all"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRegenerateCodes}>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </CardHeader>
          <Alert variant="warning" className="mb-4">
            Store these codes safely. Each can be used once to access your account if you lose your authenticator.
          </Alert>
          {loadingCodes ? (
            <p className="text-sm text-zinc-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code) => (
                <code key={code} className="rounded-lg bg-zinc-50 px-3 py-1.5 font-mono text-sm text-zinc-700 border border-zinc-200">
                  {code}
                </code>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Disable 2FA modal */}
      <Modal
        open={disableModal}
        onClose={() => { setDisableModal(false); setDisablePassword(""); setDisableError(""); }}
        title="Disable two-factor authentication"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisableModal(false)}>Cancel</Button>
            <Button variant="danger" loading={disableLoading} onClick={handleDisable}>
              Disable 2FA
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-500 mb-4">
          Enter your password to confirm. This will remove 2FA protection from your account.
        </p>
        <Input
          label="Password"
          type="password"
          value={disablePassword}
          onChange={(e) => { setDisablePassword(e.target.value); setDisableError(""); }}
          error={disableError}
          placeholder="••••••••"
        />
      </Modal>
    </div>
  );
}
