"use client";

import { useParams } from "next/navigation";
import { ThemeEditor } from "@/components/theme/ThemeEditor";

export default function ThemeEditorPage() {
  const { slug } = useParams<{ slug: string }>();

  return <ThemeEditor slug={slug} />;
}
