import { FunctionComponent } from "preact";
import {
  CheckCircleIcon,
  XCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface StatusBadgeProps {
  status: "ok" | "bad" | "warn";
  label: string;
}

export const StatusBadge: FunctionComponent<StatusBadgeProps> = ({
  status,
  label,
}) => {
  const styles = {
    ok: {
      bg: "bg-green-50",
      text: "text-green-700",
      iconColor: "text-green-500",
      Icon: CheckCircleIcon,
    },
    bad: {
      bg: "bg-red-50",
      text: "text-red-700",
      iconColor: "text-red-500",
      Icon: XCircleIcon,
    },
    warn: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      iconColor: "text-amber-500",
      Icon: WarningCircleIcon,
    },
  };

  const style = styles[status];
  const IconComponent = style.Icon;

  return (
    <div
      className={`flex items-center justify-between py-1 px-3 rounded-lg ${style.bg} transition-all hover:shadow-sm`}
    >
      <span className={`text-xs font-medium ${style.text}`}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-medium ${style.text}`}>
          {status === "ok" ? "Найдено" : "Не найдено"}
        </span>
        <IconComponent size={18} className={style.iconColor} />
      </div>
    </div>
  );
};
