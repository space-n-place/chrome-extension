import { FunctionComponent, ComponentChildren } from "preact";

interface ButtonProps {
  children?: ComponentChildren;
  onClick?: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  icon,
  variant = "secondary",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-sm hover:shadow-md",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontSize: iconSize }}
    >
      {children}
    </button>
  );
};
