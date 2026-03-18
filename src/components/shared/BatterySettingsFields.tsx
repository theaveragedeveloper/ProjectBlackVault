interface BatterySettingsFieldsProps {
  hasBattery: boolean;
  batteryType: string;
  batteryIntervalDays: string;
  onHasBatteryChange: (hasBattery: boolean) => void;
  onBatteryTypeChange: (batteryType: string) => void;
  onBatteryIntervalDaysChange: (batteryIntervalDays: string) => void;
  labelClassName?: string;
  inputClassName?: string;
}

const DEFAULT_LABEL_CLASS = "text-[10px] uppercase text-vault-text-faint block mb-1";
const DEFAULT_INPUT_CLASS =
  "w-full bg-vault-bg border border-vault-border rounded px-2 py-1.5 text-sm text-vault-text placeholder:text-vault-text-faint";

export default function BatterySettingsFields({
  hasBattery,
  batteryType,
  batteryIntervalDays,
  onHasBatteryChange,
  onBatteryTypeChange,
  onBatteryIntervalDaysChange,
  labelClassName = DEFAULT_LABEL_CLASS,
  inputClassName = DEFAULT_INPUT_CLASS,
}: BatterySettingsFieldsProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasBattery"
          checked={hasBattery}
          onChange={(e) => onHasBatteryChange(e.target.checked)}
          className="w-4 h-4 accent-[#00C2FF]"
        />
        <label htmlFor="hasBattery" className="text-sm text-vault-text">
          This accessory uses a battery
        </label>
      </div>

      {hasBattery && (
        <>
          <div>
            <label className={labelClassName}>Battery Type</label>
            <input
              type="text"
              value={batteryType}
              onChange={(e) => onBatteryTypeChange(e.target.value)}
              placeholder="e.g. CR2032, AA"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Replace Every (days)</label>
            <input
              type="number"
              min="1"
              value={batteryIntervalDays}
              onChange={(e) => onBatteryIntervalDaysChange(e.target.value)}
              placeholder="e.g. 365"
              className={inputClassName}
            />
          </div>
        </>
      )}
    </>
  );
}
