import { FunctionComponent } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Header } from "./components/widgets/Header";
import { StatusProgress } from "./components/atoms/StatusProgress";
import { EditForm } from "./components/features/EditForm";
import { Settings } from "./components/features/Settings";
import { RawJsonViewer } from "./components/features/RawJsonViewer";
import { ImageGallery } from "./components/features/ImageGallery";
import { LocationCard } from "./components/features/LocationCard";
import { Select } from "./components/atoms/Select";
import { Card } from "./components/atoms/Card";
import { Button } from "./components/atoms/Button";
import { BrainIcon, LightningIcon } from "@phosphor-icons/react";
import { API_BASE, EXTENSION_AUTH_PATH } from "../config";
import type { Address } from "../types";

type PartialListing = {
  url?: string;
  title?: string | null;
  description?: string | null;
  price?: { amount: number | null; currency: string | null };
  pricePerArea?: { amount: number | null; currency: string | null };
  area?: { value: number | null; unit?: string | null };
  address?: { formatted?: string | null };
  images?: string[];
  propertyType?: string | null;
  transactionType?: string | null;
  source?: { domain: string; extractedAt: string; method: string };
};

const REQUIRED_FIELDS = [
  "title",
  "description",
  "price",
  "area",
  "address",
  "images",
  "transactionType",
];
const FIELD_LABELS: Record<string, string> = {
  title: "Заголовок",
  description: "Описание",
  price: "Цена",
  area: "Площадь",
  address: "Адрес",
  images: "Фотографии",
  transactionType: "Тип сделки",
};

function isFilled(value: any): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    // Специальная проверка для объектов с полем value (price, area)
    if ("value" in value) {
      return value.value != null;
    }
    // Специальная проверка для объектов с полем amount (price, pricePerArea)
    if ("amount" in value) {
      return value.amount != null;
    }
    return Object.keys(value).length > 0;
  }
  return true;
}

function computeStatuses(data: PartialListing | null) {
  const statuses = REQUIRED_FIELDS.map((key) => {
    const value = data ? (data as any)[key] : undefined;
    const ok = isFilled(value);
    return {
      key,
      label: FIELD_LABELS[key],
      status: (ok ? "ok" : "bad") as "ok" | "bad" | "warn",
      value,
    };
  });
  const filled = statuses.filter((s) => s.status === "ok").length;
  const percent = Math.round((filled / REQUIRED_FIELDS.length) * 100);
  return { statuses, percent };
}

async function loadListing(): Promise<PartialListing | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SNP_GET_LISTING" }, (resp: any) =>
      resolve((resp?.data as PartialListing) || null)
    );
  });
}

async function triggerParseActiveTab(): Promise<PartialListing | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabs[0].id!,
        { type: "SNP_TRIGGER_EXTRACT" },
        (resp: any) => resolve((resp?.data as PartialListing) || null)
      );
    });
  }
  return null;
}

async function triggerParseAIOnActiveTab(): Promise<PartialListing | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabs[0].id!,
        { type: "SNP_TRIGGER_EXTRACT_AI" },
        (resp: any) => resolve((resp?.data as PartialListing) || null)
      );
    });
  }
  return null;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "listing.json";
  a.click();
  URL.revokeObjectURL(url);
}

function formatAddress(addr?: Address | null): string {
  if (!addr) return "";
  const formatted = (addr as any).formatted as string | undefined | null;
  if (typeof formatted === "string" && formatted.trim())
    return formatted.trim();

  const parts: string[] = [];
  const line1 = [addr.street, addr.houseNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (line1) parts.push(line1);
  if (addr.city) parts.push(addr.city);
  if (addr.district) parts.push(addr.district);
  if (addr.region) parts.push(addr.region);
  if (addr.postalCode) parts.push(addr.postalCode);
  if (addr.country) parts.push(addr.country);
  return parts.join(", ");
}

export const App: FunctionComponent = () => {
  const [data, setData] = useState<PartialListing | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "",
    area: "",
    transactionType: "",
    address: "",
    imageUrl: "",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<string>("");
  const [parsingMode, setParsingMode] = useState<"manual" | "ai">("manual");
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    // Load initial data
    loadListing().then((d) => {
      setData(d);
      fillFormFromData(d);
    });

    // Load settings
    chrome.storage.local
      .get(["token", "email", "parsingMode"])
      .then((result: any) => {
        if (result.email) setEmail(result.email);
        if (result.token) setToken(result.token);
        if (result.parsingMode === "manual" || result.parsingMode === "ai") {
          setParsingMode(result.parsingMode);
        }
      });

    // Listen for auth messages
    const listener = (msg: any) => {
      if (msg?.type === "SNP_TOKEN") {
        const { ok, email: newEmail, token: newToken } = msg.payload || {};
        if (ok) {
          setAuthStatus("Токен получен");
          if (newEmail) setEmail(newEmail);
          if (newToken) setToken(newToken);
        } else {
          setAuthStatus("Не удалось получить токен");
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const fillFormFromData = (d: PartialListing | null) => {
    setFormData({
      title: (d?.title || "") as string,
      description: (d?.description || "") as string,
      price: d?.price?.amount != null ? String(d.price.amount) : "",
      currency: d?.price?.currency || "",
      area: d?.area?.value != null ? String(d.area.value) : "",
      transactionType: (d?.transactionType || "") as string,
      address:
        formatAddress(d?.address as Address | null) ||
        (typeof (d as any)?.address === "string" ? (d as any).address : ""),
      imageUrl: (d?.images && d.images[0]) || "",
    });
  };

  const handleParse = async () => {
    try {
      setIsParsing(true);
      const newData = await triggerParseActiveTab();
      setData(newData);
      fillFormFromData(newData);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopy = () => {
    copyToClipboard(JSON.stringify(data, null, 2));
  };

  const handleDownload = () => {
    downloadJson(data);
  };

  const handleParsingModeChange = (mode: "manual" | "ai") => {
    setParsingMode(mode);
    chrome.storage.local.set({ parsingMode: mode });
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    const settings = await chrome.storage.local.get(["token"]);
    if (!settings.token) {
      alert("Сначала выполните вход в настройках");
      return;
    }

    const body = {
      title: formData.title || "Без названия",
      area: formData.area ? Number(formData.area) : null,
      imageUrl: formData.imageUrl || null,
      address: formData.address || null,
      goal: formData.transactionType || null,
    };

    try {
      const resp = await fetch(new URL("/api/projects", API_BASE).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Ошибка создания проекта: ${resp.status} ${txt}`);
      }
      alert("Проект создан");
    } catch (e: any) {
      alert(e.message || "Ошибка отправки");
    }
  };

  const handleLogin = async () => {
    setAuthStatus("Открываем страницу авторизации...");
    const url = new URL(EXTENSION_AUTH_PATH, API_BASE).toString();
    await chrome.tabs.create({ url, active: true });
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove(["token", "email"]);
    setEmail("");
    setToken("");
    setAuthStatus("Вы вышли");
  };

  const { statuses, percent } = computeStatuses(data);

  const [inProgress, setInProgress] = useState<string>("В процессе...");
  const variants = ["В процессе...", "Щас..", "Ещё чуть-чуть...", "Делаем..."];

  useEffect(() => {
    let i = 0;
    setInterval(() => {
      setInProgress(variants[i % variants.length]);
      i++;
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Header
        onCopy={handleCopy}
        onDownload={handleDownload}
        onParse={handleParse}
        onSettings={() => setShowSettings(!showSettings)}
        onLogin={handleLogin}
        isAuthenticated={!!token}
        email={email}
        isParsing={isParsing}
      />

      <main
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        style={{ overscrollBehavior: "contain" }}
      >
        {showSettings ? (
          <Settings
            email={email}
            onLogin={handleLogin}
            onLogout={handleLogout}
            status={authStatus}
          />
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <BrainIcon size={14} className="text-purple-600" />
                <span className="text-xs font-semibold text-gray-700">
                  Режим парсинга
                </span>
              </div>
              <div className="flex items-center justify-between gap-6 w-full">
                <Select
                  value={parsingMode}
                  onChange={(v) =>
                    handleParsingModeChange(v as "manual" | "ai")
                  }
                  options={[
                    { value: "manual", label: "Ручной парсинг (быстрый)" },
                    { value: "ai", label: "ИИ-парсинг (универсальный)" },
                  ]}
                  className="flex-1"
                />

                <Button
                  size="sm"
                  className="flex-1"
                  variant="primary"
                  onClick={handleParse}
                >
                  {parsingMode === "ai" && <LightningIcon />}
                  <span>{isParsing ? inProgress : "Запустить парсинг"}</span>
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {parsingMode === "ai" ? (
                  <>
                    <strong>ИИ-парсинг:</strong> универсальный метод, работает
                    на любых сайтах. HTML страницы предобрабатывается и
                    отправляется на сервер для анализа через ИИ.
                    <br />
                    Требуется активная подписка.
                  </>
                ) : (
                  <>
                    <strong>Ручной парсинг:</strong> быстрый метод с
                    использованием специальных парсеров для известных сайтов
                    недвижимости.
                    <br />
                    Выполняется автоматически при открытии страницы.
                  </>
                )}
              </p>
            </Card>

            <StatusProgress percent={percent} statuses={statuses} />

            {data?.images && data.images.length > 0 && (
              <ImageGallery images={data.images} />
            )}

            {data?.address && <LocationCard address={data.address} />}

            <EditForm
              data={formData}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
            />

            <RawJsonViewer data={data} />
          </>
        )}
      </main>
    </div>
  );
};
