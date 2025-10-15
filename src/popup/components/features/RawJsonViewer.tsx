import { FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import { CodeIcon, CaretDownIcon } from "@phosphor-icons/react";

interface RawJsonViewerProps {
  data: unknown;
}

export const RawJsonViewer: FunctionComponent<RawJsonViewerProps> = ({
  data,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CodeIcon size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Показать сырой JSON
          </span>
        </div>
        <CaretDownIcon
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-gray-900 max-h-64 overflow-auto">
          <pre className="text-xs text-gray-100 font-mono leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
