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
    getExportableFiles: vi.fn(),
    shareFiles: vi.fn(),
  },
  SHARE_CONFIRMATION_MESSAGE:
    "Compartilhar dados é uma alternativa de backup. Seus dados são compartilhados somente quando você confirmar.",
}));

import { ShareDataDialog } from "./share-data-dialog.widget";
import { toast } from "@/components/ui/toast";
import { dataOwnershipService } from "@/lib/data-ownership";

const addToast = vi.mocked(toast.add);
const mockedGetFiles = vi.mocked(dataOwnershipService.getExportableFiles);
const mockedShareFiles = vi.mocked(dataOwnershipService.shareFiles);

const USER_ID = "u1";

function renderDialog(canShareFile = true, onOpenChange = vi.fn()) {
  return render(
    <ShareDataDialog
      open
      onOpenChange={onOpenChange}
      userId={USER_ID}
      canShareFile={canShareFile}
    />,
  );
}

function aFile(name = "diabem.json") {
  return { fileName: name, content: "{}", mimeType: "application/json" };
}

describe("ShareDataDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms and shares the files when the user continues", async () => {
    const onOpenChange = vi.fn();
    mockedGetFiles.mockResolvedValue([aFile()]);
    mockedShareFiles.mockResolvedValue({ ok: true, method: "share" });
    renderDialog(true, onOpenChange);

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    expect(
      await screen.findByRole("button", { name: "Continuar e compartilhar" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Continuar e compartilhar" }),
    );

    await waitFor(() =>
      expect(mockedGetFiles).toHaveBeenCalledWith(USER_ID, {
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
    expect(mockedShareFiles).toHaveBeenCalledWith([aFile()]);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("labels the primary action as download when file sharing is unsupported", () => {
    renderDialog(false);

    expect(
      screen.getByRole("button", { name: "Baixar arquivo" }),
    ).toBeInTheDocument();
  });

  it("toasts that the file was downloaded when sharing falls back to download", async () => {
    mockedGetFiles.mockResolvedValue([aFile()]);
    mockedShareFiles.mockResolvedValue({ ok: true, method: "download" });
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Continuar e compartilhar" }),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Arquivo baixado.",
        type: "success",
      }),
    );
  });

  it("disables sharing while data selection is empty and warns on submit without selection", async () => {
    mockedGetFiles.mockResolvedValue([aFile()]);
    mockedShareFiles.mockResolvedValue({ ok: true, method: "share" });
    renderDialog();

    const glucose = screen.getByRole("checkbox", { name: "Glicemia" });
    const meals = screen.getByRole("checkbox", { name: "Alimentação" });
    const activities = screen.getByRole("checkbox", { name: "Atividade" });
    const notes = screen.getByRole("checkbox", { name: "Observações" });
    const medications = screen.getByRole("checkbox", { name: "Medicamentos" });

    for (const box of [glucose, meals, activities, notes, medications]) {
      fireEvent.click(box);
    }

    const shareButton = screen.getByRole("button", { name: "Compartilhar" });
    expect(shareButton).toBeDisabled();
  });
});
