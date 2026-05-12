import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatAmount(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export function calculateDiscountedPrice(
  price: number | string,
  discountType?: string | null,
  discountValue?: number | string | null
): string {
  const basePrice = Number(price ?? 0);
  if (!discountType || !discountValue || basePrice === 0) {
    return formatAmount(basePrice);
  }

  const discount = Number(discountValue);
  if (!Number.isFinite(discount) || discount < 0) {
    return formatAmount(basePrice);
  }

  let discountedPrice = basePrice;
  if (discountType === "percentage") {
    discountedPrice = basePrice - (basePrice * discount) / 100;
  } else if (discountType === "fixed") {
    discountedPrice = basePrice - discount;
  }

  return formatAmount(Math.max(0, discountedPrice));
}

export function getDiscountDisplay(
  price: number | string,
  discountType?: string | null,
  discountValue?: number | string | null
): string | null {
  if (!discountType || !discountValue) return null;
  
  const discount = Number(discountValue);
  if (!Number.isFinite(discount) || discount < 0) return null;

  if (discountType === "percentage") {
    return `${discount}%`;
  } else if (discountType === "fixed") {
    return formatAmount(discount);
  }
  return null;
}
