// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/lib/data-ownership", () => ({
  dataOwnershipService: {
    defaultScope: {
      glucose: true,
      meals: true,
      activities: true,
      notes: true,
      medications: true,
    },
    exportUserData: vi.fn(),
  },
  BACKUP_WARNING:
    "Recomendamos exportar seus dados para manter um backup seguro antes de qualquer alteração.",
}));

import { ExportDataDialog } from "./export-data-dialog.widget";
import { toast } from "@/components/ui/toast";
import { dataOwnershipService } from "@/lib/data-ownership";

const addToast = vi.mocked(toast.add);
const mockedExport = vi.mocked(dataOwnershipService.exportUserData);

const USER_ID = "u1";

function renderDialog(onOpenChange = vi.fn()) {
  return render(
    <ExportDataDialog open onOpenChange={onOpenChange} userId={USER_ID} />,
  );
}

describe("ExportDataDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedExport.mockResolvedValue(undefined);
  });

  it("shows a backup warning before exporting and confirms the export", async () => {
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));

    expect(
      await screen.findByRole("button", { name: "Continuar e exportar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Continuar e exportar" }),
    );

    await waitFor(() =>
      expect(mockedExport).toHaveBeenCalledWith(USER_ID, {
        format: "json",
        scope: {
          glucose: true,
          meals: true,
          activities: true,
          notes: true,
          medications: true,
        },
      }),
    );
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Seus dados foram exportados.",
        type: "success",
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("goes back from the warning without exporting", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Voltar" }));

    expect(
      await screen.findByRole("button", { name: "Exportar" }),
    ).toBeInTheDocument();
    expect(mockedExport).not.toHaveBeenCalled();
  });

  it("reports a failure toast when the export throws", async () => {
    mockedExport.mockRejectedValueOnce(new Error("boom"));
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Continuar e exportar" }),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível exportar seus dados.",
        type: "error",
      }),
    );
  });
});
