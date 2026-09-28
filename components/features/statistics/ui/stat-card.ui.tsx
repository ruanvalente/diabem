import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  unit: string;
};

/**
 * Metric tile: a labelled value with a unit of measure. Shared by every
 * statistics tab so the summary metrics keep a single presentation.
 */
export function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <Card className="border-border shadow-(--shadow-card)]">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  );
}
