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
    deleteUserData: vi.fn(),
  },
}));

import { DeleteDataDialog } from "./delete-data-dialog.widget";
import { toast } from "@/components/ui/toast";
import { dataOwnershipService } from "@/lib/data-ownership";

const addToast = vi.mocked(toast.add);
const mockedExport = vi.mocked(dataOwnershipService.exportUserData);
const mockedDelete = vi.mocked(dataOwnershipService.deleteUserData);

describe("DeleteDataDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDelete.mockResolvedValue(undefined);
    mockedExport.mockResolvedValue(undefined);
  });

  it("walks through confirm → export-option and deletes without exporting", async () => {
    render(<DeleteDataDialog userId="u1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir todos os meus dados" }),
    );

    expect(
      await screen.findByRole("button", { name: "Excluir todos os dados" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir todos os dados" }),
    );

    expect(
      await screen.findByRole("button", { name: "Excluir sem exportar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Exportar e continuar" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir sem exportar" }),
    );

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("u1"));
    expect(mockedExport).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Todos os seus dados foram excluídos.",
        type: "success",
      }),
    );
  });

  it("exports before deleting when 'Exportar e continuar' is chosen", async () => {
    render(<DeleteDataDialog userId="u1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir todos os meus dados" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Excluir todos os dados" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Exportar e continuar" }),
    );

    await waitFor(() =>
      expect(mockedExport).toHaveBeenCalledWith("u1", expect.any(Object)),
    );
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("u1"));
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Dados exportados e excluídos.",
        type: "success",
      }),
    );
  });

  it("returns to the confirmation step through 'Voltar'", async () => {
    render(<DeleteDataDialog userId="u1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir todos os meus dados" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Excluir todos os dados" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Voltar" }));

    expect(
      await screen.findByRole("button", { name: "Excluir todos os dados" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir sem exportar" }),
    ).not.toBeInTheDocument();
  });

  it("shows a generic error toast when deletion fails and returns to export-option", async () => {
    mockedDelete.mockRejectedValueOnce(new Error("failed"));

    render(<DeleteDataDialog userId="u1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir todos os meus dados" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Excluir todos os dados" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Excluir sem exportar" }),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível excluir seus dados.",
        type: "error",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Exportar e continuar" }),
    ).toBeInTheDocument();
  });
});
