"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { dataOwnershipService } from "@/lib/data-ownership";
import { Trash2, Loader2 } from "lucide-react";

type DeleteStage = "idle" | "confirm" | "export-option" | "pending";

type DeleteDataDialogProps = {
  userId: string;
};

export function DeleteDataDialog({ userId }: DeleteDataDialogProps) {
  const [deleteStage, setDeleteStage] = useState<DeleteStage>("idle");
  const [isDeleting, setIsDeleting] = useState(false);

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
      toast.add({
        title: "Não foi possível concluir a exportação.",
        type: "error",
      });
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
      toast.add({
        title: "Todos os seus dados foram excluídos.",
        type: "success",
      });
      setDeleteStage("idle");
    } catch {
      toast.add({
        title: "Não foi possível excluir seus dados.",
        type: "error",
      });
      setDeleteStage("export-option");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAlertOpen =
    deleteStage === "confirm" ||
    deleteStage === "export-option" ||
    deleteStage === "pending";

  return (
    <>
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
            <AlertDialogTitle>Excluir todos os seus dados</AlertDialogTitle>
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
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
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
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteStage("confirm")}
              >
                Voltar
              </Button>
              <Button
                variant="ghost"
                disabled={isDeleting}
                onClick={handleDeleteOnly}
              >
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Excluir sem exportar
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleExportAndDelete}
              >
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
    </>
  );
}
