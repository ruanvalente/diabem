import { describe, it, expect } from "vitest";
import {
  toPlainText,
  clampText,
  validateText,
  MAX_NOTE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_CONTENT_LENGTH,
} from "./text";
import { isSafeUrl, safeHref } from "./url";

describe("toPlainText", () => {
  it("trims string values", () => {
    expect(toPlainText("  hello  ")).toBe("hello");
  });

  it("coerces numbers and booleans", () => {
    expect(toPlainText(42)).toBe("42");
    expect(toPlainText(true)).toBe("true");
  });

  it("rejects objects, arrays and null", () => {
    expect(toPlainText({ a: 1 })).toBeUndefined();
    expect(toPlainText(["x"])).toBeUndefined();
    expect(toPlainText(null)).toBeUndefined();
    expect(toPlainText(undefined)).toBeUndefined();
  });
});

describe("validateText", () => {
  it("returns the trimmed text when it fits the limit", () => {
    expect(validateText("  nota  ", MAX_NOTE_LENGTH)).toBe("nota");
  });

  it("rejects values over the limit", () => {
    expect(validateText("x".repeat(MAX_NOTE_LENGTH + 1), MAX_NOTE_LENGTH)).toBeUndefined();
  });

  it("rejects empty and non-text payloads", () => {
    expect(validateText("   ", MAX_NOTE_LENGTH)).toBeUndefined();
    expect(validateText(["array"], MAX_NOTE_LENGTH)).toBeUndefined();
    expect(validateText(null, MAX_NOTE_LENGTH)).toBeUndefined();
  });

  it("supports distinct field limits", () => {
    const meal = { description: "Arroz" };
    const notes = { content: "y".repeat(MAX_CONTENT_LENGTH) };
    expect(validateText(meal.description, MAX_DESCRIPTION_LENGTH)).toBe("Arroz");
    expect(validateText(notes.content, MAX_CONTENT_LENGTH)).toBe(notes.content);
  });
});

describe("clampText", () => {
  it("truncates to max length", () => {
    expect(clampText("abcdef", 3)).toBe("abc");
  });

  it("keeps the value unchanged when it fits", () => {
    expect(clampText("abc", 3)).toBe("abc");
  });
});

describe("isSafeUrl", () => {
  it("accepts https and http absolute URLs", () => {
    expect(isSafeUrl("https://example.com/path")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("accepts relative navigation targets", () => {
    expect(isSafeUrl("/app")).toBe(true);
    expect(isSafeUrl("#glucose")).toBe(true);
    expect(isSafeUrl("?tab=all")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl(" javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\nscript:alert(1)")).toBe(false);
    expect(isSafeUrl("browser:foo")).toBe(false);
  });

  it("rejects empty and oversized values", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("x".repeat(2049))).toBe(false);
  });
});

describe("safeHref", () => {
  it("returns the URL when safe and null otherwise", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("javascript:alert(1)")).toBeNull();
  });
});