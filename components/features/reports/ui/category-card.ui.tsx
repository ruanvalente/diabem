import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { ReportCategory } from "@/lib/reports";

const CATEGORY_OPTIONS: { value: ReportCategory; label: string }[] = [
  { value: "glucose", label: "Glicemia" },
  { value: "meals", label: "Refeições" },
  { value: "activity", label: "Atividade física" },
  { value: "notes", label: "Observações" },
];

type CategoryCardProps = {
  selected: ReportCategory[];
  onToggle: (category: ReportCategory) => void;
};

export function CategoryCard({ selected, onToggle }: CategoryCardProps) {
  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <label
              key={cat.value}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selected.includes(cat.value)}
                onChange={() => onToggle(cat.value)}
                className="size-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{cat.label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
