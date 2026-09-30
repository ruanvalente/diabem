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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Dias da semana</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NOTIFICATION_WEEKDAY_KEYS.map((day) => (
            <label
              key={day}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={value.daysOfWeek.includes(day)}
                onChange={() =>
                  onChange({
                    ...value,
                    daysOfWeek: toggleValue(value.daysOfWeek, day),
                  })
                }
                className="size-4 accent-primary"
              />
              <span>{NOTIFICATION_WEEKDAY_SHORT_LABELS[day]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Lembrar de</legend>
        <div className="space-y-1">
          {NOTIFICATION_REMINDER_TYPES.map((type) => (
            <label
              key={type}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={value.reminderTypes.includes(type)}
                onChange={() =>
                  onChange({
                    ...value,
                    reminderTypes: toggleValue(value.reminderTypes, type),
                  })
                }
                className="size-4 accent-primary"
              />
              <span>{NOTIFICATION_REMINDER_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
