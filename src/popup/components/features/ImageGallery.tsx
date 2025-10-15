import { FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import { Card } from "../atoms/Card";
import { Images, X, ArrowLeft, ArrowRight } from "@phosphor-icons/react";

interface ImageGalleryProps {
  images: string[];
}

export const ImageGallery: FunctionComponent<ImageGalleryProps> = ({
  images,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
            <Images size={16} className="text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Фотографии</h2>
        </div>
        <div className="text-center py-8 text-gray-500 text-sm">
          Фотографии не найдены
        </div>
      </Card>
    );
  }

  const validImages = images.filter((_, idx) => !imageErrors.has(idx));

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const openLightbox = (index: number) => {
    if (!imageErrors.has(index)) {
      setSelectedIndex(index);
    }
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = (e: Event) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = (e: Event) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Images size={16} className="text-green-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Фотографии
            </h2>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {validImages.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {images.slice(0, 9).map((image, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group ${
                imageErrors.has(index) ? "hidden" : ""
              }`}
              onClick={() => openLightbox(index)}
            >
              <img
                src={image}
                alt={`Фото ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={() => handleImageError(index)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Images size={24} weight="bold" className="text-white" />
                </div>
              </div>
              {index === 8 && images.length > 9 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    +{images.length - 9}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {validImages.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Не удалось загрузить изображения
          </div>
        )}
      </Card>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            onClick={closeLightbox}
          >
            <X size={24} weight="bold" className="text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Navigation */}
          {selectedIndex > 0 && (
            <button
              className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              onClick={goToPrevious}
            >
              <ArrowLeft size={24} weight="bold" className="text-white" />
            </button>
          )}

          {selectedIndex < images.length - 1 && (
            <button
              className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              onClick={goToNext}
            >
              <ArrowRight size={24} weight="bold" className="text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIndex]}
              alt={`Фото ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={() => {
                handleImageError(selectedIndex);
                closeLightbox();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};




