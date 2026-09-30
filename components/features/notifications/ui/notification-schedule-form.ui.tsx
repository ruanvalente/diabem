import {
  NOTIFICATION_PERIODS,
  NOTIFICATION_PERIOD_LABELS,
  NOTIFICATION_REMINDER_TYPES,
  NOTIFICATION_REMINDER_TYPE_LABELS,
  NOTIFICATION_WEEKDAY_KEYS,
  NOTIFICATION_WEEKDAY_PRESET_LABELS,
  NOTIFICATION_WEEKDAY_SHORT_LABELS,
  type NotificationPeriod,
  type NotificationReminderType,
  type NotificationWeekdayKey,
  type NotificationWeekdayPreset,
} from "@/lib/notifications/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type NotificationScheduleFormValue = {
  label: string;
  period: NotificationPeriod;
  time: string;
  enabled: boolean;
  daysOfWeek: NotificationWeekdayKey[];
  reminderTypes: NotificationReminderType[];
};

type NotificationScheduleFormProps = {
  value: NotificationScheduleFormValue;
  onChange: (value: NotificationScheduleFormValue) => void;
  weekdayPreset: NotificationWeekdayPreset;
  onWeekdayPresetChange: (preset: NotificationWeekdayPreset) => void;
};

type SelectOption = { value: string; label: string };

const PERIOD_ITEMS: SelectOption[] = NOTIFICATION_PERIODS.map((period) => ({
  value: period,
  label: NOTIFICATION_PERIOD_LABELS[period],
}));

const WEEKDAY_PRESET_ITEMS: SelectOption[] = (
  Object.keys(NOTIFICATION_WEEKDAY_PRESET_LABELS) as NotificationWeekdayPreset[]
).map((preset) => ({
  value: preset,
  label: NOTIFICATION_WEEKDAY_PRESET_LABELS[preset],
}));

const LABEL_ID = "notification-schedule-label";
const PERIOD_ID = "notification-schedule-period";
const TIME_ID = "notification-schedule-time";
const REPEAT_ID = "notification-schedule-repeat";

/**
 * Labelled dropdown. The options are declared once: `items` gives the control
 * its accessible names and the same list renders the popup.
 */
function SelectField({
  id,
  label,
  placeholder,
  value,
  items,
  onValueChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  items: SelectOption[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onValueChange(next);
        }}
        items={items}
      >
        <SelectTrigger id={id} size="default" className="h-10 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function toggleValue<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

/** Shared shape of a checkbox row: whole row is the touch target and the label. */
const TOGGLE_ITEM_BASE_CLASS =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm";

type ToggleOption<T extends string> = { value: T; label: string };

/**
 * A set of options the user can switch on and off. The legend names the group
 * and each checkbox keeps its own accessible name through its label, so no
 * `aria-label` is needed.
 */
function ToggleGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  className,
  itemClassName,
}: {
  legend: string;
  options: readonly ToggleOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  className: string;
  itemClassName: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className={className}>
        {options.map((option) => (
          <label key={option.value} className={cn(TOGGLE_ITEM_BASE_CLASS, itemClassName)}>
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const DAY_ITEMS: ToggleOption<NotificationWeekdayKey>[] = NOTIFICATION_WEEKDAY_KEYS.map(
  (day) => ({ value: day, label: NOTIFICATION_WEEKDAY_SHORT_LABELS[day] }),
);

const TYPE_ITEMS: ToggleOption<NotificationReminderType>[] = NOTIFICATION_REMINDER_TYPES.map(
  (type) => ({ value: type, label: NOTIFICATION_REMINDER_TYPE_LABELS[type] }),
);

export function NotificationScheduleForm({
  value,
  onChange,
  weekdayPreset,
  onWeekdayPresetChange,
}: NotificationScheduleFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={LABEL_ID}>Nome do lembrete (opcional)</Label>
        <Input
          id={LABEL_ID}
          value={value.label}
          maxLength={40}
          placeholder="Ex.: Medição da manhã"
          onChange={(event) =>
            onChange({ ...value, label: event.target.value })
          }
        />
      </div>

      <SelectField
        id={PERIOD_ID}
        label="Período"
        placeholder="Selecione um período"
        value={value.period}
        items={PERIOD_ITEMS}
        onValueChange={(period) =>
          onChange({ ...value, period: period as NotificationPeriod })
        }
      />

      <div className="space-y-1.5">
        <Label htmlFor={TIME_ID}>Horário</Label>
        <Input
          id={TIME_ID}
          type="time"
          value={value.time}
          onChange={(event) => onChange({ ...value, time: event.target.value })}
        />
      </div>

      <SelectField
        id={REPEAT_ID}
        label="Repetir"
        placeholder="Selecione uma repetição"
        value={weekdayPreset}
        items={WEEKDAY_PRESET_ITEMS}
        onValueChange={(preset) =>
          onWeekdayPresetChange(preset as NotificationWeekdayPreset)
        }
      />

      <ToggleGroup
        legend="Dias da semana"
        options={DAY_ITEMS}
        selected={value.daysOfWeek}
        onToggle={(day) =>
          onChange({ ...value, daysOfWeek: toggleValue(value.daysOfWeek, day) })
        }
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        itemClassName="gap-2 border border-border has-checked:border-primary has-checked:bg-primary/5"
      />

      <ToggleGroup
        legend="Lembrar de"
        options={TYPE_ITEMS}
        selected={value.reminderTypes}
        onToggle={(type) =>
          onChange({ ...value, reminderTypes: toggleValue(value.reminderTypes, type) })
        }
        className="space-y-1"
        itemClassName="hover:bg-muted"
      />

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) =>
            onChange({ ...value, enabled: event.target.checked })
          }
          className="size-4 accent-primary"
        />
        <span className="font-medium text-foreground">
          Ativar este lembrete
        </span>
      </label>
    </div>
  );
}
