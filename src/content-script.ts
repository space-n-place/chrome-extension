import { parseWithRegistry } from "./parsers/registry";
import type { Listing } from "./types";
import {
  preprocessHTML,
  getHTMLSize,
  formatSize,
} from "./utils/html-preprocessor";
import { API_BASE_HTTPS } from "./config";

/**
 * Парсинг через AI
 */
async function parseWithAI(): Promise<Partial<Listing> | null> {
  try {
    // Предобработка HTML
    const originalSize = getHTMLSize(document.documentElement.outerHTML);
    const cleanedHTML = preprocessHTML();
    const cleanedSize = getHTMLSize(cleanedHTML);

    console.log(
      `[SNP] HTML preprocessed: ${formatSize(originalSize)} → ${formatSize(cleanedSize)} (${Math.round((cleanedSize / originalSize) * 100)}%)`
    );

    // Прокси-запрос через background (обходит CORS)
    const resp = await new Promise<any>((resolve: (value: any) => void) => {
      chrome.runtime.sendMessage(
        {
          type: "SNP_PARSE_AI",
          payload: { html: cleanedHTML, url: window.location.href },
        },
        (response: any) => resolve(response)
      );
    });

    if (!resp || !resp.ok) {
      console.error(
        "[SNP] AI parsing failed:",
        resp?.status || resp?.error || "UNKNOWN"
      );
      return null;
    }

    const result = resp.data as Listing;
    console.log("[SNP] AI parsing successful:", result);

    // Преобразуем результат в формат Listing
    const listing: Partial<Listing> = {
      ...result,
      url: window.location.href,
      source: {
        domain: window.location.hostname,
        extractedAt: new Date().toISOString(),
        method: "hybrid", // AI + preprocessing
      },
    };

    return listing;
  } catch (error) {
    console.error("[SNP] AI parsing error:", error);
    return null;
  }
}

/**
 * Ручной парсинг (автозапуск)
 */
async function extractAndSendManual(): Promise<Partial<Listing> | null> {
  try {
    const data = await parseWithRegistry();
    if (!data) return null;
    chrome.runtime.sendMessage({
      type: "SNP_LISTING_EXTRACTED",
      payload: data,
    });
    return data;
  } catch (error) {
    console.error("[SNP] Manual extraction error:", error);
    return null;
  }
}

/**
 * Основная функция извлечения данных
 */
async function extractAndSend(): Promise<Partial<Listing> | null> {
  try {
    // Проверяем режим парсинга
    const settings = await chrome.storage.local.get(["parsingMode"]);
    const mode = settings.parsingMode || "manual";

    let data: Partial<Listing> | null = null;

    if (mode === "ai") {
      console.log("[SNP] Using AI parsing mode");
      data = await parseWithAI();
    } else {
      console.log("[SNP] Using manual parsing mode");
      data = await parseWithRegistry();
    }

    if (!data) return null;

    chrome.runtime.sendMessage({
      type: "SNP_LISTING_EXTRACTED",
      payload: data,
    });
    return data;
  } catch (error) {
    console.error("[SNP] Extraction error:", error);
    return null;
  }
}

chrome.runtime.onMessage.addListener(
  (msg: any, _sender: any, sendResponse: (response?: any) => void) => {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "SNP_TRIGGER_EXTRACT") {
      extractAndSend()
        .then((data) => sendResponse({ ok: true, data }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
    if (msg.type === "SNP_TRIGGER_EXTRACT_AI") {
      parseWithAI()
        .then((data) => {
          if (data) {
            chrome.runtime.sendMessage({
              type: "SNP_LISTING_EXTRACTED",
              payload: data,
            });
          }
          sendResponse({ ok: true, data });
        })
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
  }
);

// SSO token bridge: слушаем сообщения со страницы spacenplace.me и ретранслируем в расширение
window.addEventListener("message", (event: MessageEvent) => {
  try {
    const allowedHost = /(^|\.)spacenplace\.me$/i;
    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (!(allowedHost.test(location.hostname) || isLocal)) return;
    const data: any = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== "SNP_TOKEN") return;
    let token = data.token || data.sessionToken;
    // Нормализуем входящий токен
    if (typeof token === "string") {
      token = token.replace(/^Bearer\s+/i, "").trim();
    }
    const email = data.email || null;
    const ok = !!token;
    if (ok) {
      chrome.storage.local.set({ token, email });
    }
    chrome.runtime.sendMessage({
      type: "SNP_TOKEN",
      payload: { token, email, ok },
    });
  } catch (_) {
    // ignore
  }
});

// Автозапуск на страницах (только для ручного режима)
chrome.storage.local.get(["parsingMode"]).then((settings: any) => {
  const mode = settings.parsingMode || "manual";
  if (mode === "manual") {
    extractAndSendManual();
  } else {
    console.log(
      "[SNP] AI mode is selected — auto-parse disabled. Use popup to start AI parsing."
    );
  }
});
