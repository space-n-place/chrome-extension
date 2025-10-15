import { FunctionComponent, JSX } from "preact";

interface CardProps {
  children: any;
  className?: string;
}

export const Card: FunctionComponent<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}
    >
      {children}
    </div>
  );
};
