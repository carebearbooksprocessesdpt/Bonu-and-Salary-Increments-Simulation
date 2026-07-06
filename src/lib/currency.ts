import type { CurrencyCode, CurrencyDisplay } from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeExchangeRate(exchangeRate: number | null | undefined): number | null {
  if (!isFiniteNumber(exchangeRate) || exchangeRate <= 0) return null;
  return exchangeRate;
}

export function toKsh(value: number, currency: CurrencyCode, exchangeRate?: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  if (currency === "KSH") return value;
  const rate = normalizeExchangeRate(exchangeRate);
  if (!isFiniteNumber(rate)) return null;
  return value * rate;
}

export function fromKsh(valueKsh: number, currency: CurrencyDisplay, exchangeRate?: number | null): number | null {
  if (!isFiniteNumber(valueKsh)) return null;
  if (currency === "KSH") return valueKsh;
  const rate = normalizeExchangeRate(exchangeRate);
  if (!isFiniteNumber(rate)) return null;
  return valueKsh / rate;
}

export function formatCurrency(
  valueKsh: number | null | undefined,
  display: CurrencyDisplay = "KSH",
  exchangeRate?: number | null
): string {
  if (!isFiniteNumber(valueKsh)) return "Needs numbers";

  if (display === "KSH") {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    });

    return formatter.format(valueKsh).replace("KES", "KSh");
  }

  const rate = normalizeExchangeRate(exchangeRate);
  if (!isFiniteNumber(rate)) return "Needs Exchange Rate";

  const displayValue = valueKsh / rate;
  if (!isFiniteNumber(displayValue)) return "Needs Exchange Rate";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  });

  return formatter.format(displayValue);
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
