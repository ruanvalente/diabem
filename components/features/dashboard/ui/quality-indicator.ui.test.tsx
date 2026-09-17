// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { QualityIndicator } from "./quality-indicator.ui";
import type { DataQuality } from "@/lib/intelligence/types/analytics.types";

const QUALITY: DataQuality = {
  totalRecords: 10,
  missingValues: 1,
  duplicatedRecords: 0,
  periodCoverage: 0.8,
  sufficientForAnalysis: true,
  score: 0.7,
  level: "medium",
  issues: [
    {
      code: "unknown_provenance",
      severity: "warning",
      field: "provenance",
      message: "Origem do registro desconhecida",
    },
  ],
};

describe("QualityIndicator", () => {
  it("renders the quality level as text", () => {
    render(<QualityIndicator quality={QUALITY} />);
    expect(screen.getByText("Qualidade dos dados")).toBeInTheDocument();
    expect(screen.getByText("Média")).toBeInTheDocument();
  });

  it("renders the score percentage", () => {
    render(<QualityIndicator quality={QUALITY} />);
    expect(screen.getByText("Índice de qualidade: 70%")).toBeInTheDocument();
  });

  it("renders the number of detected issues", () => {
    render(<QualityIndicator quality={QUALITY} />);
    expect(
      screen.getByText("1 inconsistência técnica detectada.")
    ).toBeInTheDocument();
  });

  it("does not render issues when there are none", () => {
    render(
      <QualityIndicator
        quality={{ ...QUALITY, issues: [], score: 1, level: "high" }}
      />
    );
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.queryByText(/inconsistência/)).not.toBeInTheDocument();
  });

  it("maps unknown level to a readable label", () => {
    render(
      <QualityIndicator
        quality={{ ...QUALITY, level: "unknown", score: 0 }}
      />
    );
    expect(screen.getByText("Desconhecida")).toBeInTheDocument();
  });
});