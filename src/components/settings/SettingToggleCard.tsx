import { ReactNode } from "react";

interface SettingToggleCardProps {
  enabled: boolean;
  onToggle: () => void;
  title: string;
  description: string;
  enabledStateText?: string;
  disabledStateText?: string;
  icon?: ReactNode;
}

export function SettingToggleCard({
  enabled,
  onToggle,
  title,
  description,
  enabledStateText = "On",
  disabledStateText = "Off",
  icon,
}: SettingToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
        enabled
          ? "border-[#00C2FF]/40 bg-[#00C2FF]/5"
          : "border-vault-border hover:border-vault-text-muted/20"
      }`}
    >
      <div
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
          enabled ? "bg-[#00C2FF]" : "bg-vault-border"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            enabled ? "left-4" : "left-0.5"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {icon}
          <p className="text-sm font-medium text-vault-text">{title}</p>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
              enabled
                ? "text-[#00C2FF] border-[#00C2FF]/30"
                : "text-vault-text-faint border-vault-border"
            }`}
          >
            {enabled ? enabledStateText : disabledStateText}
          </span>
        </div>
        <p className="text-xs text-vault-text-faint mt-0.5">{description}</p>
      </div>
    </button>
  );
}
