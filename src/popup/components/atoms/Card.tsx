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
      className={`rounded-xl border border-gray-100 bg-white/10 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
      }}
    >
      {children}
    </div>
  );
};
