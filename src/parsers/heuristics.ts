import { Listing } from "../types";
import { parseNumber, toSquareMeters } from "../utils/normalize";

type PartialListing = Partial<Listing>;

function getAllText(): string {
  try {
    return document.body?.innerText || "";
  } catch {
    return "";
  }
}

function normalizeSpaces(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : null;
}

function absoluteUrl(url: string): string | null {
  try {
    return new URL(url, document.baseURI).toString();
  } catch {
    return null;
  }
}

function chooseCurrencyByFrequency(): string | null {
  const text = getAllText();
  if (!text) return null;
  const patterns: { re: RegExp; code: string }[] = [
    { re: /\$/g, code: "USD" },
    { re: /€/g, code: "EUR" },
    { re: /£/g, code: "GBP" },
    { re: /₽|руб\.?|RUB/gi, code: "RUB" },
    { re: /₴|грн|UAH/gi, code: "UAH" },
    { re: /¥|円|JPY/gi, code: "JPY" },
    { re: /₹|INR/gi, code: "INR" },
    { re: /₩|KRW/gi, code: "KRW" },
    { re: /CHF/gi, code: "CHF" },
  ];
  const counts: Record<string, number> = {};
  for (const { re, code } of patterns) {
    const matches = text.match(re);
    const count = matches ? matches.length : 0;
    if (count > 0) counts[code] = (counts[code] || 0) + count;
  }
  let winner: string | null = null;
  let max = 0;
  for (const code of Object.keys(counts)) {
    const c = counts[code];
    if (c > max) {
      max = c;
      winner = code;
    }
  }
  // минимальный порог «встречается более двух раз»
  if (max >= 3) return winner;
  return null;
}

function findPriceNearCurrency():
  | { amount: number | null; currency: string | null }
  | undefined {
  const text = getAllText();
  if (!text) return undefined;
  // Варианты: "$ 250,000" или "250 000 ₽" или "EUR 300.000"
  const patterns: RegExp[] = [
    /(\$|€|£|₽|₴|¥|₹|₩|CHF|USD|EUR|GBP|RUB|UAH|JPY|INR|KRW)\s*([\d\s.,]+)/i,
    /([\d\s.,]+)\s*(\$|€|£|₽|₴|¥|₹|₩|CHF|USD|EUR|GBP|RUB|UAH|JPY|INR|KRW)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const g1 = m[1];
      const g2 = m[2];
      const currencyLike = /[A-Za-z€£$¥₽₴₹₩]/.test(g1) ? g1 : g2;
      const numberLike = /[\d]/.test(g1) ? g1 : g2;
      const amount = parseNumber(numberLike);
      let currency: string | null = null;
      const map: Record<string, string> = {
        $: "USD",
        "€": "EUR",
        "£": "GBP",
        "₽": "RUB",
        руб: "RUB",
        RUB: "RUB",
        "₴": "UAH",
        UAH: "UAH",
        "¥": "JPY",
        JPY: "JPY",
        "₹": "INR",
        INR: "INR",
        "₩": "KRW",
        KRW: "KRW",
        CHF: "CHF",
        USD: "USD",
        EUR: "EUR",
        GBP: "GBP",
      };
      const key = (currencyLike || "").toUpperCase();
      currency = map[currencyLike] || map[key] || null;
      return { amount: amount ?? null, currency };
    }
  }
  return undefined;
}

function findAreaFromText():
  | { value: number | null; unit?: string | null }
  | undefined {
  const text = getAllText();
  if (!text) return undefined;
  // 56 m2 / 56 m² / 56 sqm / 600 sqft / 600 ft²
  const re = /(\d[\d\s.,]*)\s*(m2|m²|sqm|кв\.?\s*м|sq\s*ft|ft²)/i;
  const m = text.match(re);
  if (!m) return undefined;
  const raw = m[1];
  const unit = (m[2] || "").toLowerCase();
  const val = parseNumber(raw);
  if (val == null) return undefined;
  if (/sq\s*ft|ft²/.test(unit)) {
    const meters = toSquareMeters(val, "sqft");
    return { value: meters.value, unit: meters.unit };
  }
  return { value: toSquareMeters(val, "m2").value, unit: "m2" };
}

function findAddressBySelectors(): string | null {
  const selectors = [
    "[class*='location' i]",
    "[class*='address' i]",
    "[class*='addr' i]",
    "[class*='map' i]",
    "[class*='place' i]",
    "[data-testid*='location' i]",
    "[itemprop='address']",
  ].join(",");
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors));
  const candidates = nodes
    .map((n) => normalizeSpaces(n.innerText))
    .filter((t): t is string => !!t && t.length > 10);
  if (!candidates.length) return null;
  // берём самую длинную разумную строку
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] || null;
}

function findImagesFromDom(limit = 6): string[] {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
  const urls: string[] = [];
  for (const img of imgs) {
    const srcset = img.getAttribute("srcset") || "";
    const parts = srcset
      .split(",")
      .map((p) => p.trim().split(" ")[0])
      .filter(Boolean);
    const candidates = [img.currentSrc, img.src, ...parts].filter(
      Boolean
    ) as string[];
    for (const u of candidates) {
      const abs = absoluteUrl(u);
      if (abs && !urls.includes(abs)) urls.push(abs);
      if (urls.length >= limit) break;
    }
    if (urls.length >= limit) break;
  }
  return urls;
}

function findTitleFallback(): string | null {
  const h1 = normalizeSpaces(document.querySelector("h1")?.textContent || null);
  if (h1) return h1;
  return normalizeSpaces(document.title || null);
}

function inferTransactionFromPage(): Listing["transactionType"] {
  const text = getAllText().toLowerCase();
  if (!text) return null;
  if (/(rent|аренда|nájem|miete|alquiler|aluguel)/i.test(text)) return "rent";
  if (/(sale|продажа|verkauf|venta|venda|sprzedaż|продам)/i.test(text))
    return "sale";
  return null;
}

export function enrichWithHeuristics(base: PartialListing): PartialListing {
  const next: PartialListing = { ...base };
  // console.log("enrichWithHeuristics", next);

  // Валюта: если не угадали ранее — определяем по частоте символов
  const freqCurrency = chooseCurrencyByFrequency();
  if (!next.price?.currency && freqCurrency) {
    next.price = { amount: next.price?.amount ?? null, currency: freqCurrency };
  }
  if (!next.pricePerArea?.currency && freqCurrency && next.pricePerArea) {
    next.pricePerArea = {
      amount: next.pricePerArea.amount,
      currency: freqCurrency,
    };
  }

  // Цена (если отсутствует) — ищем рядом с валютой
  if (!next.price?.amount) {
    const p = findPriceNearCurrency();
    if (p) {
      next.price = {
        amount: p.amount,
        currency: next.price?.currency || p.currency || freqCurrency || null,
      };
    }
  }

  // Площадь (если отсутствует)
  if (!next.area?.value) {
    const a = findAreaFromText();
    if (a) {
      next.area = { value: a.value, unit: a.unit || "m2" };
    }
  }

  // Адрес (если отсутствует)
  if (!next.address?.formatted) {
    const addr = findAddressBySelectors();
    if (addr) {
      next.address = { ...(next.address || {}), formatted: addr };
    }
  }

  // Изображения (если отсутствуют)
  if (!next.images || next.images.length === 0) {
    const imgs = findImagesFromDom();
    if (imgs.length) next.images = imgs;
  }

  // Заголовок (если отсутствует)
  if (!next.title) {
    const t = findTitleFallback();
    if (t) next.title = t;
  }

  // Тип сделки (если отсутствует)
  if (!next.transactionType) {
    next.transactionType = inferTransactionFromPage();
  }

  // Источник — не трогаем, пусть остаётся как в базовом
  return next;
}
