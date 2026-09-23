// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { SyncHistoryEntry } from "@/lib/devices";
import { SyncHistory } from "./sync-history.ui";

const entry: SyncHistoryEntry = {
  id: "h1",
  userId: "u1",
  deviceId: "dev-1",
  deviceName: "Glicosímetro Bayer",
  syncedAt: "2026-09-23T14:05:00.000Z",
  importedCount: 3,
  duplicateCount: 2,
  errorCount: 1,
  ok: true,
};

describe("SyncHistory", () => {
  it("renders an empty message when there are no entries", () => {
    render(<SyncHistory entries={[]} />);

    expect(
      screen.getByText("Nenhuma sincronização registrada ainda.")
    ).toBeInTheDocument();
  });

  it("renders device name and the imported counts", () => {
    render(<SyncHistory entries={[entry]} />);

    expect(screen.getByText("Glicosímetro Bayer")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        (element?.textContent ?? "").includes("3 novo(s)")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        (element?.textContent ?? "").includes("2 duplicado(s)")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        (element?.textContent ?? "").includes("1 erro(s)")
      ).length
    ).toBeGreaterThan(0);
  });

  it("omits duplicate/error suffixes when they are zero", () => {
    render(
      <SyncHistory
        entries={[{ ...entry, duplicateCount: 0, errorCount: 0 }]}
      />
    );

    expect(screen.getByText("Glicosímetro Bayer")).toBeInTheDocument();
    expect(screen.queryByText(/duplicado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/erro/)).not.toBeInTheDocument();
  });
});