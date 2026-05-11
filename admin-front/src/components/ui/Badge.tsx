import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 ring-green-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger:  "bg-red-50 text-red-700 ring-red-200",
  info:    "bg-blue-50 text-blue-700 ring-blue-200",
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function tenantStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "active":    return "success";
    case "suspended": return "danger";
    case "pending":   return "warning";
    case "cancelled": return "neutral";
    default:          return "neutral";
  }
}
