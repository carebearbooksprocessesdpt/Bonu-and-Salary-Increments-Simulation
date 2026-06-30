import type { CurrencyCode, CurrencyDisplay } from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function toKsh(value: number, currency: CurrencyCode, exchangeRate?: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  if (currency === "KSH") return value;
  if (!isFiniteNumber(exchangeRate) || exchangeRate <= 0) return null;
  return value * exchangeRate;
}

export function fromKsh(valueKsh: number, currency: CurrencyDisplay, exchangeRate?: number | null): number | null {
  if (!isFiniteNumber(valueKsh)) return null;
  if (currency === "KSH") return valueKsh;
  if (!isFiniteNumber(exchangeRate) || exchangeRate <= 0) return null;
  return valueKsh / exchangeRate;
}

export function formatCurrency(
  valueKsh: number | null | undefined,
  display: CurrencyDisplay = "KSH",
  exchangeRate?: number | null
): string {
  if (!isFiniteNumber(valueKsh)) return "Needs numbers";

  const displayValue = display === "KSH" ? valueKsh : fromKsh(valueKsh, "USD", exchangeRate);
  if (!isFiniteNumber(displayValue)) return "Needs rate";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: display === "KSH" ? "KES" : "USD",
    maximumFractionDigits: display === "KSH" ? 0 : 2
  });

  return display === "KSH"
    ? formatter.format(displayValue).replace("KES", "KSh")
    : formatter.format(displayValue);
}

export function formatRuleCurrency(value: number | null | undefined, currency: CurrencyCode | undefined): string {
  if (!isFiniteNumber(value) || !currency) return "Not specified";
  if (currency === "KSH") {
    return `KSh ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function parseNumericInput(value: string): number | "" {
  if (value.trim() === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}
