// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { InsightDetails } from "./insight-details.ui";
import type { Insight } from "@/lib/intelligence/types/insight.types";

const INSIGHT: Insight = {
  id: "ins-trend-0",
  type: "observation",
  priority: "medium",
  title: "Tendência identificada",
  description: "Foi identificada uma tendência nos seus registros.",
  evidence: [
    {
      metric: "glucose_count",
      value: 5,
      period: {
        start: "2026-09-01T00:00:00.000Z",
        end: "2026-09-07T00:00:00.000Z",
      },
    },
  ],
  ruleId: "trend-detected",
  ruleVersion: "1.0.0",
  explanation: "Foi identificado um aumento nas medições de glicemia.",
  sourceIds: ["g1", "g2", "g3", "g4", "g5"],
  generatedAt: "2026-09-07T12:00:00.000Z",
};

describe("InsightDetails", () => {
  it("renders the explanation trigger", () => {
    render(<InsightDetails insight={INSIGHT} />);
    expect(
      screen.getByRole("button", { name: /por que estou vendo isso/i })
    ).toBeInTheDocument();
  });

  it("opens the dialog with the explanation and rule metadata", async () => {
    render(<InsightDetails insight={INSIGHT} />);
    fireEvent.click(
      screen.getByRole("button", { name: /por que estou vendo isso/i })
    );

    expect(
      await screen.findByText("Como este insight foi gerado")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Foi identificado um aumento nas medições de glicemia.")
    ).toBeInTheDocument();
    expect(screen.getByText("trend-detected v1.0.0")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("Período analisado")).toBeInTheDocument();
    expect(screen.getByText("Gerado em")).toBeInTheDocument();
  });
});