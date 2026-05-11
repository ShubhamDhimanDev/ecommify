import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<AlertVariant, { wrapper: string; icon: React.ElementType; iconClass: string }> = {
  success: { wrapper: "bg-green-50 border-green-200 text-green-800", icon: CheckCircle2, iconClass: "text-green-500" },
  error:   { wrapper: "bg-red-50 border-red-200 text-red-800",       icon: AlertCircle,  iconClass: "text-red-500" },
  warning: { wrapper: "bg-amber-50 border-amber-200 text-amber-800", icon: AlertTriangle, iconClass: "text-amber-500" },
  info:    { wrapper: "bg-blue-50 border-blue-200 text-blue-800",    icon: Info,          iconClass: "text-blue-500" },
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { wrapper, icon: Icon, iconClass } = styles[variant];

  return (
    <div className={cn("flex gap-3 rounded-lg border p-3.5 text-sm", wrapper, className)}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconClass)} />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
