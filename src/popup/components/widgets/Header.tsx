import { FunctionComponent } from "preact";
import { Button } from "../atoms/Button";
import {
  ArrowClockwiseIcon,
  CopyIcon,
  DownloadSimpleIcon,
  GearIcon,
  SignInIcon,
} from "@phosphor-icons/react";

const Logo: FunctionComponent<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 856 856"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="36" y="116" width="783" height="644" rx="197" fill="#D9D9D9" />
    <path
      d="M574.596 256.746H617.596C652.058 256.746 679.506 258.278 699.938 261.346C720.373 264.105 738.366 272.996 753.919 288.021C769.776 303.046 777.707 327.116 777.707 360.232C777.707 390.282 770.996 413.126 757.578 428.764C744.465 444.095 728.148 454.214 708.63 459.12C689.417 463.72 667.155 466.018 641.841 466.018V598.941L574.596 604.46V256.746ZM653.735 411.285C671.424 411.285 685.301 407.607 695.365 400.247C705.733 392.888 710.918 379.397 710.918 359.772C710.918 340.456 706.19 327.422 696.736 320.678C687.284 313.931 672.34 310.559 651.905 310.559H642.3V411.285H653.735Z"
      fill="#CE837A"
    />
    <path
      d="M477.368 603.237L377.185 387.525V853.24L317.258 856V258.282L387.249 255.523L475.996 460.656V5.51935L545.426 0V597.718L477.368 603.237Z"
      fill="#00AF66"
    />
    <path
      d="M191.077 662.833C163.324 662.833 139.842 655.167 120.628 639.836C101.72 624.198 87.8441 603.348 79 577.285L135.724 550.609L141.214 559.806C150.058 575.138 158.445 587.097 166.374 595.682C174.608 604.269 184.825 608.56 197.024 608.56C204.953 608.56 211.967 604.728 218.066 597.063C224.471 589.397 227.673 580.965 227.673 571.766C227.673 563.181 225.538 555.36 221.269 548.309C216.999 541.256 211.509 535.584 204.8 531.29L144.873 495.415C127.49 485.602 113.614 473.184 103.245 458.161C92.8761 443.136 87.6916 426.27 87.6916 407.567C87.6916 387.636 92.2662 369.851 101.415 354.213C110.869 338.575 123.526 326.463 139.384 317.878C155.547 309.294 173.693 305 193.821 305C217.304 305 237.279 310.825 253.748 322.478C270.216 334.129 282.415 351.454 290.344 374.451L233.62 400.207C232.4 397.754 229.808 392.235 225.843 383.651C221.878 375.064 216.999 368.932 211.204 365.253C205.715 361.266 198.853 359.273 190.619 359.273C180.555 359.273 172.778 362.492 167.289 368.932C162.104 375.37 159.512 383.651 159.512 393.769C159.512 401.129 161.494 407.873 165.459 414.005C169.729 419.832 174.761 424.432 180.555 427.804L235.907 460.461C276.773 483.764 298.273 514.427 300.408 552.447C300.408 574.219 295.529 593.535 285.77 610.401C276.316 626.957 263.202 639.836 246.429 649.035C229.96 658.235 211.509 662.833 191.077 662.833Z"
      fill="#3A4141"
    />
  </svg>
);

interface HeaderProps {
  onCopy: () => void;
  onDownload: () => void;
  onParse: () => void;
  onSettings: () => void;
  onLogin: () => void;
  isAuthenticated: boolean;
  email?: string;
  isParsing?: boolean;
}

export const Header: FunctionComponent<HeaderProps> = ({
  onCopy,
  onDownload,
  onParse,
  onSettings,
  onLogin,
  isAuthenticated,
  email,
  isParsing = false,
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="text-lg font-bold text-gray-900">Parser</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Действия */}
          <Button size="sm" onClick={onCopy} variant="ghost">
            <CopyIcon />
          </Button>
          <Button size="sm" onClick={onDownload} variant="ghost">
            <DownloadSimpleIcon />
          </Button>
          <Button
            size="sm"
            onClick={onParse}
            variant="ghost"
            disabled={isParsing}
          >
            <ArrowClockwiseIcon />
          </Button>

          {/* Разделитель */}
          <div className="w-px h-6 bg-gray-300" />

          {/* Авторизация */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium text-green-700">
                  {email || "Авторизован"}
                </span>
              </div>
              <Button size="sm" onClick={onSettings} variant="ghost">
                <GearIcon />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onLogin} variant="primary">
              <SignInIcon />
              <span>Войти</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
