export function parseNumber(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  let s = input
    .replace(/\u00A0/g, " ")
    .replace(/[^0-9.,\-\s]/g, "")
    .trim();

  // Count separators
  const dotCount = (s.match(/\./g) || []).length;
  const commaCount = (s.match(/,/g) || []).length;

  if (dotCount && commaCount) {
    // Both present: decide decimal by rightmost separator
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    s = s.split(thousandSep).join("");
    if (decimalSep === ",") s = s.replace(",", ".");
  } else if (dotCount > 1 && commaCount === 0) {
    // Many dots: treat as thousands separators
    s = s.split(".").join("");
  } else if (commaCount > 1 && dotCount === 0) {
    // Many commas: treat as thousands separators
    s = s.split(",").join("");
  } else if (commaCount === 1 && dotCount === 0) {
    // Single comma: if exactly 3 digits after -> thousands; else decimal
    const parts = s.split(",");
    if (parts[1] && parts[1].replace(/\D/g, "").length === 3) {
      s = parts.join("");
    } else {
      s = s.replace(",", ".");
    }
  } else if (dotCount === 1 && commaCount === 0) {
    // Single dot: if exactly 3 digits after -> thousands; else decimal
    const parts = s.split(".");
    if (parts[1] && parts[1].replace(/\D/g, "").length === 3) {
      s = parts.join("");
    }
  }

  // Remove spaces used as thousand separators
  s = s.replace(/\s+/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function detectCurrency(text?: string | null): string | null {
  if (!text) return null;
  const map: Record<string, string> = {
    $: "USD",
    US$: "USD",
    A$: "AUD",
    C$: "CAD",
    CA$: "CAD",
    "€": "EUR",
    "£": "GBP",
    "₽": "RUB",
    "₴": "UAH",
    "₪": "ILS",
    "₺": "TRY",
    "₹": "INR",
    "¥": "JPY",
    "₩": "KRW",
    R$: "BRL",
    zł: "PLN",
  };
  for (const [symbol, code] of Object.entries(map)) {
    if (text.includes(symbol)) return code;
  }
  // try ISO codes
  const iso =
    /(USD|CAD|AUD|EUR|GBP|RUB|UAH|ILS|TRY|INR|JPY|KRW|BRL|PLN|MXN|COP|ARS|CLP|PEN|UYU|CHF|SEK|NOK|DKK|CZK|HUF|RON|BGN|HRK|RSD|AED|SAR|QAR|KWD|BHD|OMR|EGP|CNY|HKD|TWD|KRW|SGD|MYR|THB|VND|IDR|PHP|PKR|BDT|ZAR)/i;
  const m = text.match(iso);
  return m ? m[1].toUpperCase() : null;
}

export function toSquareMeters(
  value: number | null,
  unit?: string | null
): { value: number | null; unit: string | null } {
  if (value == null) return { value: null, unit: unit || null };
  const u = unit?.toLowerCase();
  if (!u) return { value, unit: "m2" };
  if (u.includes("m2") || u.includes("sqm") || u.includes("square meter"))
    return { value, unit: "m2" };
  if (u.includes("sqft") || u.includes("ft2") || u.includes("square foot"))
    return { value: value * 0.092903, unit: "m2" };
  return { value, unit: unit ?? null };
}

export function pickFirst<T>(...vals: Array<T | undefined | null>): T | null {
  for (const v of vals) if (v != null) return v as T;
  return null;
}

export function absoluteUrl(url: string): string {
  try {
    return new URL(url, location.href).toString();
  } catch {
    return url;
  }
}
