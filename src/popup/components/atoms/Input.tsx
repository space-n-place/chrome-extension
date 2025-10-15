import { FunctionComponent, JSX } from "preact";

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export const Input: FunctionComponent<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  rows = 3,
  className = "",
}) => {
  const baseStyles =
    "w-full px-3 py-2 bg-white text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all";

  const handleChange = (
    e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.currentTarget.value);
  };

  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-gray-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onInput={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={`${baseStyles} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onInput={handleChange}
          placeholder={placeholder}
          className={baseStyles}
        />
      )}
    </label>
  );
};
