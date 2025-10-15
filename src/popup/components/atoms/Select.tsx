import { FunctionComponent, JSX } from "preact";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export const Select: FunctionComponent<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = "",
}) => {
  const handleChange = (e: JSX.TargetedEvent<HTMLSelectElement>) => {
    onChange(e.currentTarget.value);
  };

  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-gray-700">{label}</span>
      )}
      <select
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};
