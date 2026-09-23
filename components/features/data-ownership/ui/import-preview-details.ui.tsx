import type { ImportPreview } from "@/lib/data-ownership";

type ImportPreviewDetailsProps = {
  preview: ImportPreview;
  totalCount: number;
};

export function ImportPreviewDetails({
  preview,
  totalCount,
}: ImportPreviewDetailsProps) {
  return (
    <div className="space-y-4" aria-live="polite">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Preview da importação
        </p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Arquivo</dt>
            <dd className="font-medium text-foreground">{preview.fileName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd className="font-medium text-foreground uppercase">
              {preview.fileKind}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Glicemias</dt>
            <dd>{preview.glucoseCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Refeições</dt>
            <dd>{preview.mealsCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Atividades</dt>
            <dd>{preview.activitiesCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Observações</dt>
            <dd>{preview.notesCount}</dd>
          </div>
          <div className="my-2 h-px bg-border" />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total de registros</dt>
            <dd className="font-medium text-foreground">{totalCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Duplicados</dt>
            <dd>{preview.duplicateCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Erros</dt>
            <dd>{preview.errorCount}</dd>
          </div>
        </dl>
      </div>

      {preview.errorCount > 0 && (
        <p className="text-sm text-destructive" role="alert">
          {preview.errorCount} registro(s) não poderão ser importados.
        </p>
      )}
    </div>
  );
}
