import { cn } from "@/lib/utils";

type ListSkeletonProps = {
  rows?: number;
  className?: string;
};

export function ListSkeleton({ rows = 4, className }: ListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Carregando registros"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl bg-muted/70"
        />
      ))}
      <span className="sr-only">Carregando registros</span>
    </div>
  );
}