import { describe, it, expect } from "vitest";
import {
  DeviceError,
  defaultMessage,
  toFriendlyMessage,
} from "./device.errors";

describe("DeviceError", () => {
  it("falls back to a friendly PT-BR default message", () => {
    const error = new DeviceError({ code: "connection-failed" });
    expect(error.name).toBe("DeviceError");
    expect(error.code).toBe("connection-failed");
    expect(error.message).toContain("Não foi possível conectar");
  });

  it("keeps a custom message when provided", () => {
    const error = new DeviceError({
      code: "unsupported-device",
      message: "Custom",
    });
    expect(error.message).toBe("Custom");
  });

  it("carries the cause", () => {
    const cause = new Error("underlying");
    const error = new DeviceError({ code: "sync-failed", cause });
    expect(error.cause).toBe(cause);
  });
});

describe("defaultMessage", () => {
  it("returns a message for every documented code", () => {
    const codes = [
      "device-not-found",
      "permission-denied",
      "connection-failed",
      "connection-lost",
      "unsupported-device",
      "unsupported-browser",
      "invalid-data",
      "malformed-packet",
      "sync-failed",
      "unknown",
    ] as const;
    for (const code of codes) {
      expect(defaultMessage(code)).toBeTruthy();
    }
  });
});

describe("toFriendlyMessage", () => {
  it("maps a DeviceError to its message", () => {
    const error = new DeviceError({ code: "permission-denied" });
    expect(toFriendlyMessage(error)).toBe(error.message);
  });

  it("returns the unknown fallback for non-Device errors", () => {
    expect(toFriendlyMessage(new Error("raw gatt error"))).toBe(
      defaultMessage("unknown")
    );
    expect(toFriendlyMessage("string")).toBe(defaultMessage("unknown"));
  });
});
