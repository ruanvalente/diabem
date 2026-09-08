"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/use-auth";
import { dataOwnershipService } from "@/lib/data-ownership";
import { ExportDataDialog } from "../ui/export-data-dialog.ui";
import { PrivacyInfoDialog } from "../ui/privacy-info-dialog.ui";
import { ImportDataDialog } from "./import-data-dialog.widget";
import { ShareDataDialog } from "./share-data-dialog.widget";
import { Download, Upload, Share2, Trash2, Database, Loader2 } from "lucide-react";

type DeleteStage = "idle" | "confirm" | "export-option" | "pending";

export function DataOwnershipSection() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteStage, setDeleteStage] = useState<DeleteStage>("idle");
  const [isDeleting, setIsDeleting] = useState(false);

  const canShareFile = useMemo(() => dataOwnershipService.canShareFile(), []);

  const handleExportAndDelete = async () => {
    setIsDeleting(true);
    try {
      await dataOwnershipService.exportUserData(userId, {
        format: "json",
        scope: dataOwnershipService.defaultScope,
      });
      await dataOwnershipService.deleteUserData(userId);
      toast.add({ title: "Dados exportados e excluídos.", type: "success" });
      setDeleteStage("idle");
    } catch {
      toast.add({ title: "Não foi possível concluir a exportação.", type: "error" });
      setDeleteStage("export-option");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOnly = async () => {
    setIsDeleting(true);
    setDeleteStage("pending");
    try {
      await dataOwnershipService.deleteUserData(userId);
      toast.add({ title: "Todos os seus dados foram excluídos.", type: "success" });
      setDeleteStage("idle");
    } catch {
      toast.add({ title: "Não foi possível excluir seus dados.", type: "error" });
      setDeleteStage("export-option");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAlertOpen = deleteStage === "confirm" || deleteStage === "export-option" || deleteStage === "pending";

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

        <div className="border-t border-border px-5 py-4">
          <Button
            variant="destructive"
            className="h-12 w-full justify-start gap-3 px-4 hover:cursor-pointer"
            onClick={() => setDeleteStage("confirm")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Excluir todos os meus dados
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Esta ação exclui os dados de saúde armazenados neste dispositivo.
          </p>
        </div>
      </CardContent>

      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} userId={userId} />
      <ImportDataDialog open={importOpen} onOpenChange={setImportOpen} userId={userId} />
      <ShareDataDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        userId={userId}
        canShareFile={canShareFile}
      />
      <PrivacyInfoDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />

      <AlertDialog
        open={deleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteStage("idle");
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Excluir todos os seus dados
            </AlertDialogTitle>
            {deleteStage === "confirm" ? (
              <AlertDialogDescription>
                Esta ação excluirá os dados armazenados neste dispositivo e não
                poderá ser desfeita.
              </AlertDialogDescription>
            ) : deleteStage === "export-option" ? (
              <AlertDialogDescription>
                Deseja exportar seus dados antes de continuar?
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                Excluindo seus dados...
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {deleteStage === "confirm" && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteStage("export-option");
                }}
              >
                Excluir todos os dados
              </Button>
            </AlertDialogFooter>
          )}

          {deleteStage === "export-option" && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteStage("confirm")}
              >
                Voltar
              </Button>
              <Button variant="ghost" disabled={isDeleting} onClick={handleDeleteOnly}>
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Excluir sem exportar
              </Button>
              <Button variant="destructive" disabled={isDeleting} onClick={handleExportAndDelete}>
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Exportar e continuar
              </Button>
            </AlertDialogFooter>
          )}

          {deleteStage === "pending" && (
            <AlertDialogFooter>
              <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:col-span-2 sm:justify-center">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Excluindo seus dados...
              </span>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
