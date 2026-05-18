"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useTheme } from "@/hooks/useTheme";

interface ThemeSelectorProps {
  slug: string;
}

export function ThemeSelector({ slug }: ThemeSelectorProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const { themes, activeThemeId, loading, activatingThemeId, error, activateTheme } = useTheme({
    slug,
    onSuccess: setSuccessMessage,
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      {error && <Alert variant="error">{error.message}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Card>
        <CardHeader className="mb-0">
          <div>
            <CardTitle>Theme selector</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Pick one active theme for this store, then customize sections and settings.
            </p>
          </div>

          <Link href={`/${slug}/themes/editor`}>
            <Button type="button" variant="outline" size="sm">Open editor</Button>
          </Link>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <Card key={theme.id} padding="none" className="overflow-hidden">
              <div className="relative h-40 bg-zinc-100">
                {theme.preview_image ? (
                  <Image
                    src={theme.preview_image}
                    alt={theme.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{theme.name}</p>
                    <p className="text-xs text-zinc-500">{theme.code} · v{theme.version}</p>
                  </div>
                  {isActive && <Badge variant="success">Active</Badge>}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={activatingThemeId === theme.id}
                    disabled={isActive}
                    onClick={() => void activateTheme(theme.id)}
                  >
                    {isActive ? "Active" : "Activate"}
                  </Button>
                  <Link href={`/${slug}/themes/editor`} className="inline-flex">
                    <Button type="button" variant="secondary" size="sm">
                      Customize
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
