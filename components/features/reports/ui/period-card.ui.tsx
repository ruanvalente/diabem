import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import type { PeriodSelection } from "@/lib/date";

type PeriodCardProps = {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
};

export function PeriodCard({ value, onChange }: PeriodCardProps) {
  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="size-4 text-primary" />
          Período
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <PeriodRangeFilter value={value} onChange={onChange} />
      </CardContent>
    </Card>
  );
}
