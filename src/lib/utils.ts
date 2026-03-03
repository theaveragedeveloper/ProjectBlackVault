import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function roundsLabel(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M rds`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K rds`;
  return `${count} rds`;
}

export function stockStatus(quantity: number, lowAlert?: number | null): "ok" | "low" | "critical" | "empty" {
  if (quantity === 0) return "empty";
  if (lowAlert && quantity <= lowAlert / 2) return "critical";
  if (lowAlert && quantity <= lowAlert) return "low";
  return "ok";
}
