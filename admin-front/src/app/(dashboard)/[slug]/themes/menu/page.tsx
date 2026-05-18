"use client";

import { useParams } from "next/navigation";
import { ThemeMenuBuilder } from "@/components/theme/ThemeMenuBuilder";

export default function ThemeMenuPage() {
  const { slug } = useParams<{ slug: string }>();

  return <ThemeMenuBuilder slug={slug} />;
}
