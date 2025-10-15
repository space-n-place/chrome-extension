import { FunctionComponent } from "preact";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

interface StatusItem {
  key: string;
  label: string;
  status: "ok" | "bad" | "warn";
  value?: any;
}

interface StatusProgressProps {
  percent: number;
  statuses: StatusItem[];
}

export const StatusProgress: FunctionComponent<StatusProgressProps> = ({
  percent,
  statuses,
}) => {
  return (
    <Card className="animate-fade-in">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Статус парсинга
          </h2>
          <span className="text-sm font-bold text-blue-600">{percent}%</span>
        </div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
          {percent < 100 && (
            <div
              className="absolute inset-y-0 bg-white/30 animate-shimmer"
              style={{ width: `${percent}%` }}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        {statuses.map((s) => (
          <StatusBadge key={s.key} status={s.status} label={s.label} />
        ))}
      </div>
    </Card>
  );
};
