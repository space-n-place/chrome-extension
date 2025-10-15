import { FunctionComponent } from "preact";
import { Card } from "../atoms/Card";
import { MapPinIcon, NavigationArrowIcon } from "@phosphor-icons/react";

interface LocationCardProps {
  address?: {
    formatted?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
  };
}

export const LocationCard: FunctionComponent<LocationCardProps> = ({
  address,
}) => {
  if (!address || (!address.formatted && !address.latitude)) {
    return null;
  }

  const hasCoordinates = address.latitude != null && address.longitude != null;

  const openInGoogleMaps = () => {
    if (hasCoordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
      window.open(url, "_blank");
    } else if (address.formatted) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address.formatted
      )}`;
      window.open(url, "_blank");
    }
  };

  const openInYandexMaps = () => {
    if (hasCoordinates) {
      const url = `https://yandex.ru/maps/?ll=${address.longitude},${address.latitude}&z=16&pt=${address.longitude},${address.latitude}`;
      window.open(url, "_blank");
    } else if (address.formatted) {
      const url = `https://yandex.ru/maps/?text=${encodeURIComponent(
        address.formatted
      )}`;
      window.open(url, "_blank");
    }
  };

  const copyCoordinates = async () => {
    if (hasCoordinates) {
      const coords = `${address.latitude}, ${address.longitude}`;
      try {
        await navigator.clipboard.writeText(coords);
      } catch {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = coords;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <MapPinIcon size={16} className="text-primary-600" weight="fill" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">
          Местоположение
        </h2>
      </div>

      {/* Адрес */}
      {address.formatted && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Адрес</div>
          <div className="text-sm font-medium text-gray-900">
            {address.formatted}
          </div>
        </div>
      )}

      {/* Координаты */}
      {hasCoordinates && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Координаты</div>
          <div
            className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={copyCoordinates}
            title="Нажмите чтобы скопировать"
          >
            <NavigationArrowIcon
              size={16}
              className="text-primary-600"
              weight="fill"
            />
            <span className="text-sm font-mono font-medium text-gray-900">
              {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}
            </span>
            <span className="ml-auto text-xs text-gray-500">Копировать</span>
          </div>
        </div>
      )}

      {/* Кнопки карт */}
      <div className="flex gap-2">
        <button
          onClick={openInGoogleMaps}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#4285F4"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
          Google Maps
        </button>

        <button
          onClick={openInYandexMaps}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#FC3F1D"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
          Яндекс Карты
        </button>
      </div>
    </Card>
  );
};
