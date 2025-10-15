/**
 * Парсинг геолокации из различных источников
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Извлекает координаты из JSON-LD
 */
export function extractGeoFromJsonLd(jsonld: any): GeoCoordinates | null {
  if (!jsonld) return null;

  // Schema.org geo структуры
  const geo = jsonld.geo || jsonld.object?.geo;
  if (geo) {
    const lat = parseFloat(geo.latitude);
    const lng = parseFloat(geo.longitude);
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // GeoCoordinates в address
  const address = jsonld.address || jsonld.object?.address;
  if (address?.geo) {
    const lat = parseFloat(address.geo.latitude);
    const lng = parseFloat(address.geo.longitude);
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

/**
 * Ищет координаты в тексте на странице
 * Паттерны: "43.601958, 39.717169" или "lat: 43.601958, lng: 39.717169"
 */
export function extractGeoFromPageText(): GeoCoordinates | null {
  // Поиск в data-атрибутах
  const dataGeo = document.querySelector(
    "[data-lat][data-lng], [data-latitude][data-longitude]"
  );
  if (dataGeo) {
    const lat = parseFloat(
      dataGeo.getAttribute("data-lat") ||
        dataGeo.getAttribute("data-latitude") ||
        ""
    );
    const lng = parseFloat(
      dataGeo.getAttribute("data-lng") ||
        dataGeo.getAttribute("data-longitude") ||
        ""
    );
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Поиск в мета-тегах
  const metaLat = document.querySelector(
    'meta[property="place:location:latitude"]'
  );
  const metaLng = document.querySelector(
    'meta[property="place:location:longitude"]'
  );
  if (metaLat && metaLng) {
    const lat = parseFloat(metaLat.getAttribute("content") || "");
    const lng = parseFloat(metaLng.getAttribute("content") || "");
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Поиск паттернов координат в тексте
  const bodyText = document.body.innerText;

  // Паттерн: "43.601958, 39.717169" или "43.601958,39.717169"
  const coordPattern = /(-?\d{1,3}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/g;
  const matches = [...bodyText.matchAll(coordPattern)];

  for (const match of matches) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Поиск в скриптах (например, Google Maps)
  const scripts = document.querySelectorAll("script:not([src])");
  for (const script of scripts) {
    const text = script.textContent || "";

    // Паттерны для различных карт
    const patterns = [
      /lat[itude]*\s*:\s*(-?\d{1,3}\.\d{4,})/i,
      /lng|lon[gitude]*\s*:\s*(-?\d{1,3}\.\d{4,})/i,
    ];

    let lat: number | null = null;
    let lng: number | null = null;

    const latMatch = text.match(patterns[0]);
    const lngMatch = text.match(patterns[1]);

    if (latMatch) lat = parseFloat(latMatch[1]);
    if (lngMatch) lng = parseFloat(lngMatch[1]);

    if (lat !== null && lng !== null && isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

/**
 * Проверяет валидность координат
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // Исключаем 0,0 (обычно placeholder)
    !(lat === 0 && lng === 0)
  );
}




