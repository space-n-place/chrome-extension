import { FunctionComponent } from "preact";
import { Card } from "../atoms/Card";
import { Button } from "../atoms/Button";
import { Select } from "../atoms/Select";
import {
  GearIcon,
  UserIcon,
  SignInIcon,
  SignOutIcon,
  BrainIcon,
} from "@phosphor-icons/react";

interface SettingsProps {
  email?: string;
  onLogin: () => void;
  onLogout: () => void;
  status?: string;
  parsingMode?: "manual" | "ai";
  onParsingModeChange?: (mode: "manual" | "ai") => void;
}

export const Settings: FunctionComponent<SettingsProps> = ({
  email,
  onLogin,
  onLogout,
  status,
  parsingMode = "manual",
  onParsingModeChange,
}) => {
  return (
    <Card className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
          <GearIcon size={16} className="text-purple-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Настройки</h2>
      </div>

      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        Авторизация производится через сайт. Нажмите «Войти», мы откроем
        страницу авторизации, после чего расширение автоматически получит токен.
      </p>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <UserIcon size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500">
            Текущий пользователь
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900 ml-5">
          {email || "Не авторизован"}
        </p>
      </div>

      <div className="flex gap-2">
        {email ? (
          <Button variant="secondary" onClick={onLogout} className="flex-1">
            <SignOutIcon />
            <span>Выйти</span>
          </Button>
        ) : (
          <Button variant="primary" onClick={onLogin} className="flex-1">
            <SignInIcon />
            <span>Войти</span>
          </Button>
        )}
      </div>

      {status && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-primary-700">{status}</p>
        </div>
      )}
    </Card>
  );
};
