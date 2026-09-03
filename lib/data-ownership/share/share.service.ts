import type { ShareResult, ShareableFile } from "./share.types";

/**
 * Encapsulates the Web Share API. The UI must never call navigator.share()
 * directly — always go through this service.
 */

/**
 * Detects whether the current browser supports navigator.share() with files.
 * The share must be explicitly triggered by a user gesture.
 */
export function canShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined"
  );
}

function toFile(file: ShareableFile): File {
  return new File([file.content], file.fileName, { type: file.mimeType });
}

function triggerDownload(file: ShareableFile): void {
  const blob =
    file.content instanceof Blob ? file.content : new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a file (text or binary) using a temporary anchor. Does not trigger
 * the Web Share API; useful for explicit "download" actions.
 */
export function downloadFile(file: ShareableFile): void {
  triggerDownload(file);
}

/**
 * Shares a file via the Web Share API when available, otherwise falls back to
 * a download. Handles user cancellation gracefully (returns cancelled: true).
 */
export async function shareFile(file: ShareableFile): Promise<ShareResult> {
  if (canShare()) {
    try {
      const shareData: ShareData = {
        title: file.fileName,
        files: [toFile(file)],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { ok: true, method: "share" };
      }
    } catch (error) {
      // AbortError means the user cancelled — not a failure.
      if (error instanceof DOMException && error.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
      // Other errors fall through to download fallback.
    }
  }

  triggerDownload(file);
  return { ok: true, method: "download" };
}
