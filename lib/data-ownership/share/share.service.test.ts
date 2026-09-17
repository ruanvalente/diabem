// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { canShare, shareFile } from "./share.service";
import type { ShareableFile } from "./share.types";

function makePdf(): ShareableFile {
  return {
    fileName: "relatorio.pdf",
    content: new Blob(["pdf-content"], { type: "application/pdf" }),
    mimeType: "application/pdf",
  };
}

type ShareApiNavigator = Navigator & {
  share?: (data?: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

function setShareApi(
  share: ((data?: ShareData) => Promise<void>) | undefined,
  canShareResult: boolean | ((data?: ShareData) => boolean) = true,
) {
  const nav = navigator as ShareApiNavigator;
  Object.defineProperty(nav, "share", { configurable: true, value: share });
  Object.defineProperty(nav, "canShare", {
    configurable: true,
    value: typeof canShareResult === "function" ? canShareResult : () => canShareResult,
  });
}

function stubDownloadApi() {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURL,
  });

  const anchorClick = vi.fn();
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    const el = createElement(tagName);
    if (tagName === "a") {
      Object.defineProperty(el, "click", { configurable: true, value: anchorClick });
    }
    return el;
  });

  return { createObjectURL, revokeObjectURL, anchorClick };
}

afterEach(() => {
  vi.restoreAllMocks();
  setShareApi(undefined);
});

describe("shareFile", () => {
  it("shares the file via the Web Share API when supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShareApi(share);

    const result = await shareFile(makePdf());

    expect(share).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, method: "share" });
  });

  it("returns cancelled when the user aborts the share", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    setShareApi(share);

    const result = await shareFile(makePdf());

    expect(result).toEqual({ ok: false, cancelled: true });
  });

  it("surfaces real share failures instead of silently downloading", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("Must be handling a user gesture", "NotAllowedError"));
    setShareApi(share);

    await expect(shareFile(makePdf())).rejects.toThrow(DOMException);
  });

  it("falls back to a download when files are not shareable", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShareApi(share, () => false);
    const downloads = stubDownloadApi();

    const result = await shareFile(makePdf());

    expect(share).not.toHaveBeenCalled();
    expect(downloads.anchorClick).toHaveBeenCalledTimes(1);
    expect(downloads.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, method: "download" });
  });

  it("falls back to a download when the Web Share API is unavailable", async () => {
    setShareApi(undefined);
    const downloads = stubDownloadApi();

    expect(canShare()).toBe(false);

    const result = await shareFile(makePdf());

    expect(downloads.anchorClick).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, method: "download" });
  });
});