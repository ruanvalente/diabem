// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ImportPreviewDetails } from "./import-preview-details.ui";

function createPreview(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "backup.json",
    fileKind: "json" as const,
    glucoseCount: 3,
    mealsCount: 2,
    activitiesCount: 1,
    notesCount: 4,
    medicationsCount: 2,
    totalRecords: 12,
    duplicateCount: 0,
    errorCount: 0,
    errors: [],
    ...overrides,
  };
}

describe("ImportPreviewDetails", () => {
  it("renders the envelope and per-type counts", () => {
    render(<ImportPreviewDetails preview={createPreview()} totalCount={10} />);

    expect(screen.getByText("backup.json")).toBeInTheDocument();
    expect(screen.getByText("json")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows the total from the totalCount prop, not the preview total", () => {
    render(
      <ImportPreviewDetails
        preview={createPreview({ totalRecords: 99 })}
        totalCount={10}
      />,
    );

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("warns about records that cannot be imported when errorCount > 0", () => {
    render(
      <ImportPreviewDetails
        preview={createPreview({ errorCount: 2 })}
        totalCount={10}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 registro(s) não poderão ser importados.",
    );
  });

  it("does not warn when there are no errors", () => {
    render(<ImportPreviewDetails preview={createPreview()} totalCount={10} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders an unspecified file kind as-is", () => {
    render(
      <ImportPreviewDetails
        preview={createPreview({ fileKind: "csv" })}
        totalCount={10}
      />,
    );

    expect(screen.getByText("csv")).toBeInTheDocument();
  });
});
