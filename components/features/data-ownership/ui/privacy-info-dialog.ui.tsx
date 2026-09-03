"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PRIVACY_POINTS = [
  "Dados armazenados localmente neste dispositivo",
  "Funcionamento offline sem depender de servidores",
  "Dados sensíveis protegidos no armazenamento local",
  "Exportação de dados sempre disponível",
  "Você pode excluir seus dados a qualquer momento",
];

type PrivacyInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrivacyInfoDialog({
  open,
  onOpenChange,
}: PrivacyInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como seus dados são armazenados</DialogTitle>
          <DialogDescription>
            Você tem controle total sobre seus dados de saúde.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 text-sm">
          {PRIVACY_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-foreground">{point}</span>
            </li>
          ))}
        </ul>

        <p className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          Nenhum dado é enviado automaticamente para a internet. O DiaBem não
          compartilha seus dados com serviços de terceiros sem sua ação
          explícita.
        </p>

        <div className="mt-2 flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
