import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CurrencyPayload = Record<string, unknown>;

function extractRate(payload: CurrencyPayload): number | null {
  const directRate = payload.rate;
  if (typeof directRate === "number" && Number.isFinite(directRate)) return directRate;

  const result = payload.result;
  if (typeof result === "number" && Number.isFinite(result)) return result;

  const rates = payload.rates;
  if (rates && typeof rates === "object" && "KES" in rates) {
    const rate = (rates as Record<string, unknown>).KES;
    if (typeof rate === "number" && Number.isFinite(rate)) return rate;
  }

  const conversionRates = payload.conversion_rates;
  if (conversionRates && typeof conversionRates === "object" && "KES" in conversionRates) {
    const rate = (conversionRates as Record<string, unknown>).KES;
    if (typeof rate === "number" && Number.isFinite(rate)) return rate;
  }

  return null;
}

export async function GET() {
  const endpoint = process.env.CURRENCY_API_URL;
  const apiKey = process.env.CURRENCY_API_KEY;

  if (!endpoint) {
    return NextResponse.json({
      ok: false,
      configured: false,
      rate: null,
      source: "manual",
      message: "Live exchange rate not available — enter the rate manually below."
    });
  }

  try {
    const url = endpoint
      .replaceAll("{base}", "USD")
      .replaceAll("{target}", "KES")
      .replaceAll("{quote}", "KES")
      .replaceAll("{apiKey}", apiKey ?? "");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        configured: true,
        rate: null,
        source: "manual",
        message: "Couldn't reach the live exchange rate right now — enter the rate manually below."
      });
    }

    const payload = (await response.json()) as CurrencyPayload;
    const rate = extractRate(payload);

    if (!rate || rate <= 0) {
      return NextResponse.json({
        ok: false,
        configured: true,
        rate: null,
        source: "manual",
        message: "Live exchange rate wasn't in the expected format — enter the rate manually below."
      });
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      rate,
      source: "provider",
      message: "Latest USD to KSh exchange rate loaded."
    });
  } catch {
    return NextResponse.json({
      ok: false,
      configured: true,
      rate: null,
      source: "manual",
      message: "Couldn't reach the live exchange rate right now — enter the rate manually below."
    });
  }
}