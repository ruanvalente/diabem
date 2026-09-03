export type ShareableFile = {
  fileName: string;
  /** Raw text content (CSV/JSON) or binary content (PDF blob/array). */
  content: string | Blob;
  mimeType: string;
};

export type ShareResult =
  | { ok: true; method: "share" | "download" }
  | { ok: false; cancelled: boolean; message?: string };
