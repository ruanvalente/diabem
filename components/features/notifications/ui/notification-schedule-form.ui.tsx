import {
  NOTIFICATION_PERIODS,
  NOTIFICATION_PERIOD_LABELS,
  NOTIFICATION_REMINDER_TYPES,
  NOTIFICATION_REMINDER_TYPE_LABELS,
  NOTIFICATION_WEEKDAY_KEYS,
  NOTIFICATION_WEEKDAY_PRESETS,
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
  idPrefix?: string;
};

function matchesPreset(
  days: readonly NotificationWeekdayKey[],
  preset: NotificationWeekdayPreset,
): boolean {
  if (preset === "custom") return false;
  const expected = NOTIFICATION_WEEKDAY_PRESETS[preset];
  return (
    days.length === expected.length && expected.every((day) => days.includes(day))
  );
}

function toggleValue<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function resolveWeekdayPreset(
  days: readonly NotificationWeekdayKey[],
): NotificationWeekdayPreset {
  const preset = (Object.keys(NOTIFICATION_WEEKDAY_PRESETS) as Exclude<
    NotificationWeekdayPreset,
    "custom"
  >[]).find((candidate) => matchesPreset(days, candidate));
  return preset ?? "custom";
}

export function NotificationScheduleForm({
  value,
  onChange,
  weekdayPreset,
  onWeekdayPresetChange,
  idPrefix = "notification-schedule",
}: NotificationScheduleFormProps) {
  const periodId = `${idPrefix}-period`;
  const timeId = `${idPrefix}-time`;
  const labelId = `${idPrefix}-label`;
  const repeatId = `${idPrefix}-repeat`;
  const daysId = `${idPrefix}-days`;
  const typesId = `${idPrefix}-types`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={labelId}>Nome do lembrete (opcional)</Label>
        <Input
          id={labelId}
          value={value.label}
          maxLength={40}
          placeholder="Ex.: Medição da manhã"
          onChange={(event) => onChange({ ...value, label: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={periodId}>Período</Label>
        <Select
          value={value.period}
          onValueChange={(next) => {
            if (next) onChange({ ...value, period: next as NotificationPeriod });
          }}
        >
          <SelectTrigger id={periodId} size="default" className="h-10 w-full">
            <SelectValue>
              {(selected: string | null) =>
                selected
                  ? NOTIFICATION_PERIOD_LABELS[selected as NotificationPeriod]
                  : "Selecione um período"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_PERIODS.map((period) => (
              <SelectItem key={period} value={period}>
                {NOTIFICATION_PERIOD_LABELS[period]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={timeId}>Horário</Label>
        <Input
          id={timeId}
          type="time"
          value={value.time}
          onChange={(event) => onChange({ ...value, time: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={repeatId}>Repetir</Label>
        <Select
          value={weekdayPreset}
          onValueChange={(next) => {
            if (next) onWeekdayPresetChange(next as NotificationWeekdayPreset);
          }}
        >
          <SelectTrigger id={repeatId} size="default" className="h-10 w-full">
            <SelectValue>
              {(selected: string | null) =>
                selected
                  ? NOTIFICATION_WEEKDAY_PRESET_LABELS[
                      selected as NotificationWeekdayPreset
                    ]
                  : "Selecione uma repetição"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(
              Object.keys(NOTIFICATION_WEEKDAY_PRESET_LABELS) as NotificationWeekdayPreset[]
            ).map((preset) => (
              <SelectItem key={preset} value={preset}>
                {NOTIFICATION_WEEKDAY_PRESET_LABELS[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend id={daysId} className="text-sm font-medium text-foreground">
          Dias da semana
        </legend>
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
        <legend id={typesId} className="text-sm font-medium text-foreground">
          Lembrar de
        </legend>
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
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          className="size-4 accent-primary"
        />
        <span className="font-medium text-foreground">Ativar este lembrete</span>
      </label>
    </div>
  );
}
