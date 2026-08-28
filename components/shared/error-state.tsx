"use client";

import { Button } from "@/components/ui/button";
import { CircleAlert, RotateCcw } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 bg-card px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">
        Não foi possível carregar seus registros.
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Tentar novamente
      </Button>
    </div>
  );
}