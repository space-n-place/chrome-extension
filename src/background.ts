// types provided by globals.d.ts fallback
import { API_BASE_HTTPS } from "./config";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "snp-extract",
    title: "SNP: Extract listing",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
  if (info.menuItemId === "snp-extract" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SNP_TRIGGER_EXTRACT" });
  }
});

chrome.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: (response?: any) => void) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "SNP_LISTING_EXTRACTED") {
      const listing = message.payload;
      chrome.storage.local.set({ lastListing: listing });
      if (sender.tab?.id) {
        chrome.action.setBadgeText({ text: "OK", tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({
          color: "#22c55e",
          tabId: sender.tab.id,
        });
        setTimeout(
          () =>
            chrome.action.setBadgeText({ text: "", tabId: sender.tab!.id! }),
          1500
        );
      }
    }

    if (message.type === "SNP_GET_LISTING") {
      chrome.storage.local.get("lastListing", ({ lastListing }: any) => {
        sendResponse({ ok: true, data: lastListing || null });
      });
      return true;
    }

    if (message.type === "SNP_PARSE_AI") {
      (async () => {
        try {
          const payload = message.payload || {};
          const html = payload.html;
          const url = payload.url;

          if (!html || !url) {
            sendResponse({ ok: false, error: "BAD_REQUEST" });
            return;
          }

          const storage = await chrome.storage.local.get(["token"]);
          let token: string | undefined = storage.token;
          if (!token) {
            sendResponse({ ok: false, error: "NO_TOKEN" });
            return;
          }
          // Нормализуем: удаляем возможный префикс "Bearer " и пробелы
          token = String(token)
            .replace(/^Bearer\s+/i, "")
            .trim();
          if (!token) {
            sendResponse({ ok: false, error: "EMPTY_TOKEN" });
            return;
          }

          const response = await fetch(
            new URL("/api/parse-ad", API_BASE_HTTPS).toString(),
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ html, url }),
            }
          );

          const text = await response.text();
          if (!response.ok) {
            sendResponse({ ok: false, status: response.status, body: text });
            return;
          }

          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch {
            sendResponse({ ok: false, error: "INVALID_JSON", body: text });
            return;
          }

          sendResponse({ ok: true, data });
        } catch (error: any) {
          sendResponse({
            ok: false,
            error: String((error && error.message) || error),
          });
        }
      })();
      return true;
    }
  }
);
