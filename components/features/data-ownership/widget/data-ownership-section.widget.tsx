"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import { dataOwnershipService } from "@/lib/data-ownership";
import { ExportDataDialog } from "./export-data-dialog.widget";
import { ImportDataDialog } from "./import-data-dialog.widget";
import { ShareDataDialog } from "./share-data-dialog.widget";
import { DeleteDataDialog } from "./delete-data-dialog.widget";
import { PrivacyInfoDialog } from "../ui/privacy-info-dialog.ui";
import { Download, Upload, Share2, Database } from "lucide-react";

export function DataOwnershipSection() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const canShareFile = useMemo(() => dataOwnershipService.canShareFile(), []);

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="size-4 text-primary" aria-hidden="true" />
          Seus dados
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Seus dados ficam armazenados neste dispositivo.
          </p>
        </div>

        <div className="border-t border-border px-5 py-4">
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3 px-4 hover:cursor-pointer"
              onClick={() => setExportOpen(true)}
            >
              <Download className="size-4 text-primary" aria-hidden="true" />
              Exportar dados
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3 px-4 hover:cursor-pointer"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="size-4 text-primary" aria-hidden="true" />
              Importar dados
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-3 px-4 hover:cursor-pointer"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4 text-primary" aria-hidden="true" />
              Compartilhar resumo
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="mt-4 rounded text-sm font-medium text-primary underline underline-offset-4 outline-none hover:text-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Saiba como seus dados são armazenados →
          </button>
        </div>

        <DeleteDataDialog userId={userId} />
      </CardContent>

      <ExportDataDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        userId={userId}
      />
      <ImportDataDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        userId={userId}
      />
      <ShareDataDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        userId={userId}
        canShareFile={canShareFile}
      />
      <PrivacyInfoDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </Card>
  );
}
