import { FunctionComponent } from "preact";
import { Card } from "../atoms/Card";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { Button } from "../atoms/Button";
import { PaperPlaneTiltIcon, PencilSimpleIcon } from "@phosphor-icons/react";

interface EditFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  area: string;
  transactionType: string;
  address: string;
  imageUrl: string;
}

interface EditFormProps {
  data: EditFormData;
  onChange: (field: keyof EditFormData, value: string) => void;
  onSubmit: () => void;
}

const transactionOptions = [
  { value: "", label: "Не выбрано" },
  { value: "sale", label: "🏠 Продажа" },
  { value: "rent", label: "🔑 Аренда" },
  { value: "lease", label: "📋 Лизинг" },
  { value: "auction", label: "🔨 Аукцион" },
];

export const EditForm: FunctionComponent<EditFormProps> = ({
  data,
  onChange,
  onSubmit,
}) => {
  return (
    <Card className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <PencilSimpleIcon size={16} className="text-primary-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">
          Редактирование
        </h2>
      </div>

      <div className="space-y-3">
        <Input
          label="Заголовок"
          value={data.title}
          onChange={(v) => onChange("title", v)}
          placeholder="Название объявления"
        />

        <Input
          label="Описание"
          value={data.description}
          onChange={(v) => onChange("description", v)}
          placeholder="Подробное описание недвижимости"
          multiline
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Цена"
            value={data.price}
            onChange={(v) => onChange("price", v)}
            placeholder="250000"
            type="number"
          />

          <Input
            label="Валюта"
            value={data.currency}
            onChange={(v) => onChange("currency", v)}
            placeholder="USD"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Площадь (м²)"
            value={data.area}
            onChange={(v) => onChange("area", v)}
            placeholder="56"
            type="number"
          />

          <Select
            label="Тип сделки"
            value={data.transactionType}
            onChange={(v) => onChange("transactionType", v)}
            options={transactionOptions}
          />
        </div>

        <Input
          label="Адрес"
          value={data.address}
          onChange={(v) => onChange("address", v)}
          placeholder="Город, улица, дом"
        />

        <Input
          label="Изображение (URL)"
          value={data.imageUrl}
          onChange={(v) => onChange("imageUrl", v)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Button variant="primary" onClick={onSubmit} className="w-full">
          <PaperPlaneTiltIcon />
          <span>Отправить проект</span>
        </Button>
      </div>
    </Card>
  );
};
