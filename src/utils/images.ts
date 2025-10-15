/**
 * Умный парсинг изображений недвижимости
 */

export interface ImageCandidate {
  url: string;
  width: number;
  height: number;
  area: number;
  score: number;
}

const MIN_IMAGE_SIZE = 300; // минимальный размер 300x300
const IDEAL_IMAGE_SIZE = 800; // идеальный размер

/**
 * Извлекает все релевантные изображения со страницы
 */
export async function extractPropertyImages(): Promise<string[]> {
  const candidates: ImageCandidate[] = [];

  // 1. Поиск галерей изображений
  const galleries = findImageGalleries();
  for (const gallery of galleries) {
    const images = await analyzeGalleryImages(gallery);
    candidates.push(...images);
  }

  // 2. Поиск отдельных больших изображений
  const standaloneImages = await findStandaloneImages();
  candidates.push(...standaloneImages);

  // 3. Поиск в JSON-LD
  const jsonLdImages = extractImagesFromJsonLd();
  for (const url of jsonLdImages) {
    if (!candidates.some((c) => c.url === url)) {
      candidates.push({
        url,
        width: 0,
        height: 0,
        area: 0,
        score: 50, // средний приоритет для JSON-LD
      });
    }
  }

  // Сортируем по score и убираем дубликаты
  const sorted = candidates
    .sort((a, b) => b.score - a.score)
    .filter((img, idx, arr) => arr.findIndex((i) => i.url === img.url) === idx);

  // Возвращаем до 20 лучших изображений
  return sorted.slice(0, 20).map((c) => c.url);
}

/**
 * Находит контейнеры-галереи с изображениями
 */
function findImageGalleries(): Element[] {
  const galleries: Element[] = [];

  // Распространенные селекторы галерей
  const gallerySelectors = [
    '[class*="gallery" i]',
    '[class*="slider" i]',
    '[class*="carousel" i]',
    '[class*="photos" i]',
    '[class*="images" i]',
    '[id*="gallery" i]',
    '[id*="slider" i]',
    '[data-testid*="gallery" i]',
    '[data-testid*="photos" i]',
  ];

  for (const selector of gallerySelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const images = el.querySelectorAll("img");
      // Считаем галереей если есть 3+ изображений
      if (images.length >= 3) {
        galleries.push(el);
      }
    }
  }

  // Поиск по количеству изображений (эвристика)
  if (galleries.length === 0) {
    const allContainers = document.querySelectorAll("div, section, article");
    for (const container of allContainers) {
      const images = Array.from(container.querySelectorAll("img")).filter(
        (img) =>
          img.parentElement === container ||
          img.parentElement?.parentElement === container
      );
      if (images.length >= 5) {
        galleries.push(container);
      }
    }
  }

  return galleries;
}

/**
 * Анализирует изображения в галерее
 */
async function analyzeGalleryImages(
  gallery: Element
): Promise<ImageCandidate[]> {
  const images = gallery.querySelectorAll("img");
  const candidates: ImageCandidate[] = [];

  for (const img of images) {
    const candidate = await analyzeImage(img as HTMLImageElement);
    if (candidate) {
      // Бонус за то что в галерее
      candidate.score += 20;
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Ищет отдельные большие изображения
 */
async function findStandaloneImages(): Promise<ImageCandidate[]> {
  const images = document.querySelectorAll("img");
  const candidates: ImageCandidate[] = [];

  for (const img of images) {
    const candidate = await analyzeImage(img as HTMLImageElement);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Анализирует одно изображение
 */
async function analyzeImage(
  img: HTMLImageElement
): Promise<ImageCandidate | null> {
  const url = getImageUrl(img);
  if (!url || isExcludedImage(url)) return null;

  // Получаем размеры
  const rect = img.getBoundingClientRect();
  let width = rect.width || img.naturalWidth || img.width;
  let height = rect.height || img.naturalHeight || img.height;

  // Если размеры не определены, пытаемся загрузить
  if (!width || !height) {
    try {
      const loaded = await loadImageSize(url);
      width = loaded.width;
      height = loaded.height;
    } catch {
      return null;
    }
  }

  // Фильтр по минимальному размеру
  if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
    return null;
  }

  const area = width * height;
  let score = 0;

  // Scoring system
  // 1. Размер (чем ближе к идеальному, тем лучше)
  const sizeDiff =
    Math.abs(width - IDEAL_IMAGE_SIZE) + Math.abs(height - IDEAL_IMAGE_SIZE);
  score += Math.max(0, 100 - sizeDiff / 10);

  // 2. Соотношение сторон (предпочитаем 3:2, 4:3, 16:9)
  const ratio = width / height;
  if (ratio >= 1.2 && ratio <= 2.0) score += 20;

  // 3. Класс или атрибуты изображения
  const className = img.className.toLowerCase();
  const alt = img.alt.toLowerCase();
  const src = url.toLowerCase();

  if (/(photo|image|picture|gallery|property|listing)/i.test(className))
    score += 15;
  if (/(photo|image|property|room|kitchen|bedroom|bathroom)/i.test(alt))
    score += 10;
  if (!/(logo|icon|avatar|user|profile|ad|banner)/i.test(src)) score += 10;

  // 4. Минус за подозрительные паттерны
  if (
    /(logo|icon|banner|ad|pixel|tracking|avatar|profile)/i.test(
      className + alt + src
    )
  ) {
    return null;
  }

  return { url, width, height, area, score };
}

/**
 * Получает URL изображения (учитывая srcset, data-src и т.д.)
 */
function getImageUrl(img: HTMLImageElement): string | null {
  // Приоритет: data-src (lazy load) > srcset > src
  let url = img.dataset.src || img.dataset.original;

  if (!url && img.srcset) {
    // Берем самое большое изображение из srcset
    const srcsetParts = img.srcset.split(",").map((s) => s.trim());
    const largest = srcsetParts[srcsetParts.length - 1];
    url = largest.split(" ")[0];
  }

  if (!url) {
    url = img.src;
  }

  if (!url || url.startsWith("data:")) return null;

  // Преобразуем относительные URL в абсолютные
  try {
    return new URL(url, location.href).toString();
  } catch {
    return null;
  }
}

/**
 * Проверяет, нужно ли исключить изображение
 */
function isExcludedImage(url: string): boolean {
  const excludePatterns = [
    /logo/i,
    /icon/i,
    /avatar/i,
    /placeholder/i,
    /pixel/i,
    /tracking/i,
    /\.svg$/i,
    /\.gif$/i,
    /banner/i,
    /ad[_-]?/i,
  ];

  return excludePatterns.some((pattern) => pattern.test(url));
}

/**
 * Загружает изображение чтобы получить его размеры
 */
function loadImageSize(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
    setTimeout(reject, 3000); // timeout 3s
  });
}

/**
 * Извлекает изображения из JSON-LD
 */
function extractImagesFromJsonLd(): string[] {
  const images: string[] = [];
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      collectImagesFromObject(data, images);
    } catch {
      // ignore
    }
  }

  return images;
}

/**
 * Рекурсивно собирает изображения из объекта
 */
function collectImagesFromObject(obj: any, images: string[]) {
  if (!obj || typeof obj !== "object") return;

  if (typeof obj.image === "string") {
    images.push(obj.image);
  } else if (Array.isArray(obj.image)) {
    for (const img of obj.image) {
      if (typeof img === "string") {
        images.push(img);
      } else if (img?.url) {
        images.push(img.url);
      }
    }
  } else if (obj.image?.url) {
    images.push(obj.image.url);
  }

  // Рекурсивно обходим вложенные объекты
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object") {
      collectImagesFromObject(obj[key], images);
    }
  }
}




