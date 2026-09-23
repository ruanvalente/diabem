// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/data-ownership", () => ({
  dataOwnershipService: {
    defaultScope: {
      glucose: true,
      meals: true,
      activities: true,
      notes: true,
      medications: true,
    },
  },
}));

import { useExportSelection } from "./use-export-selection";

const SCOPE_KEYS = [
  "glucose",
  "meals",
  "activities",
  "notes",
  "medications",
] as const;

describe("useExportSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to JSON format and all data types selected", () => {
    const { result } = renderHook(() => useExportSelection());

    expect(result.current.format).toBe("json");
    expect(result.current.anySelected).toBe(true);
    for (const key of SCOPE_KEYS) {
      expect(result.current.scope[key]).toBe(true);
    }
  });

  it("updates format", () => {
    const { result } = renderHook(() => useExportSelection());

    act(() => result.current.setFormat("csv"));

    expect(result.current.format).toBe("csv");
  });

  it("toggles a single scope key without changing the others", () => {
    const { result } = renderHook(() => useExportSelection());

    act(() => result.current.toggleScope("glucose"));

    expect(result.current.scope.glucose).toBe(false);
    expect(result.current.scope.meals).toBe(true);
  });

  it("anySelected reflects whether at least one data type is selected", () => {
    const { result } = renderHook(() => useExportSelection());

    for (const key of SCOPE_KEYS) {
      act(() => result.current.toggleScope(key));
    }

    expect(result.current.anySelected).toBe(false);

    act(() => result.current.toggleScope("notes"));

    expect(result.current.anySelected).toBe(true);
  });

  it("returns a fresh default scope object on each call", () => {
    const { result } = renderHook(() => useExportSelection());

    act(() => result.current.toggleScope("glucose"));

    const { result: result2 } = renderHook(() => useExportSelection());
    expect(result2.current.scope.glucose).toBe(true);
  });
});
