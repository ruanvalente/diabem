import type { ExportScope } from "@/lib/data-ownership";

const DATA_TYPES: { key: keyof ExportScope; label: string }[] = [
  { key: "glucose", label: "Glicemia" },
  { key: "meals", label: "Alimentação" },
  { key: "activities", label: "Atividade" },
  { key: "notes", label: "Observações" },
  { key: "medications", label: "Medicamentos" },
];

type DataScopeCheckboxesProps = {
  scope: ExportScope;
  onToggle: (key: keyof ExportScope) => void;
};

export function DataScopeCheckboxes({
  scope,
  onToggle,
}: DataScopeCheckboxesProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">
        Dados
      </legend>
      <div className="space-y-2">
        {DATA_TYPES.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={scope[item.key]}
              onChange={() => onToggle(item.key)}
              className="size-4 accent-primary"
            />
            <span className="text-sm text-foreground">{item.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
