import type { IntelligenceRequest, IntelligenceResponse } from "../types/worker.types";

type PendingRequest = {
  resolve: (response: IntelligenceResponse) => void;
};

const INTELLIGENCE_WORKER_URL = new URL(
  "./intelligence.worker.ts",
  import.meta.url
);

/**
 * Thin wrapper around the intelligence Web Worker that scopes the heavy
 * analysis off the main thread, maps each request to a typed response and
 * guarantees that only the latest request for a given sequence is honored.
 */
export class IntelligenceWorkerAdapter {
  private worker: Worker | null = null;
  private pending: Map<string, PendingRequest> = new Map();
  private supportsWorker =
    typeof window !== "undefined" && typeof Worker !== "undefined";

  private getWorker(): Worker | null {
    if (!this.supportsWorker) return null;
    if (this.worker) return this.worker;

    this.worker = new Worker(INTELLIGENCE_WORKER_URL);
    this.worker.onmessage = (event: MessageEvent<IntelligenceResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.requestId);
      if (pending) {
        this.pending.delete(response.requestId);
        pending.resolve(response);
      }
    };
    this.worker.onerror = (err) => {
      // Reject all pending requests if the worker fails globally.
      for (const [, pending] of this.pending) {
        pending.resolve({
          type: "error",
          requestId: "unknown",
          error: { code: "WORKER_ERROR", message: err.message },
        });
      }
      this.pending.clear();
    };

    return this.worker;
  }

  analyze(request: Omit<IntelligenceRequest, "requestId">, requestId: string): Promise<IntelligenceResponse> {
    const worker = this.getWorker();
    if (!worker) {
      return Promise.resolve({
        type: "error",
        requestId,
        error: {
          code: "WORKER_UNSUPPORTED",
          message: "Web Worker não suportado neste ambiente",
        },
      });
    }

    const promise = new Promise<IntelligenceResponse>((resolve) => {
      this.pending.set(requestId, { resolve });
    });

    worker.postMessage({ ...request, requestId });
    return promise;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}
