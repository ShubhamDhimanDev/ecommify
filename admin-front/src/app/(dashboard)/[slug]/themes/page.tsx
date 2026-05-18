"use client";

import { useParams } from "next/navigation";
import { ThemeSelector } from "@/components/theme/ThemeSelector";

export default function ThemesPage() {
  const { slug } = useParams<{ slug: string }>();

  return <ThemeSelector slug={slug} />;
}
