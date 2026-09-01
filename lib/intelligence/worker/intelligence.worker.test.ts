import { describe, beforeEach, expect, it, vi } from "vitest";

let postedResponses: unknown[] = [];
let onmessageFn: ((event: { data: unknown }) => void) | null = null;

type PostMessage = (msg: unknown) => void;

const postMessageSpy: PostMessage = (msg) => {
  postedResponses.push(msg);
};

// Minimal Web Worker `self` shim so the intelligence worker can be exercised
// in the Node test environment.

beforeEach(() => {
  postedResponses = [];
  onmessageFn = null;
  (globalThis as { self: unknown }).self = {
    get onmessage() {
      return onmessageFn;
    },
    set onmessage(fn) {
      onmessageFn = fn;
    },
    postMessage: postMessageSpy,
  };
});

function send(message: unknown) {
  onmessageFn?.({ data: message });
}

function period() {
  return {
    start: new Date(2026, 7, 22).toISOString(),
    end: new Date(2026, 7, 29).toISOString(),
  };
}

function request(requestId: string) {
  return {
    type: "analyze",
    requestId,
    payload: {
      glucose: [],
      meals: [],
      activities: [],
      notes: [],
      period: period(),
    },
  };
}

describe("intelligence worker", () => {
  beforeEach(async () => {
    // Re-evaluate the worker module on each test so `self.onmessage` is
    // re-registered against the current shim. `vi.resetModules()` busts the
    // module cache while keeping a clean extension so the TS transform applies.
    vi.resetModules();
    await import("./intelligence.worker");
  });

  it("responds with success for a valid analysis request", () => {
    send(request("req-1"));
    const response = postedResponses[0] as {
      type: string;
      requestId: string;
      payload: unknown;
    };
    expect(response.type).toBe("success");
    expect(response.requestId).toBe("req-1");
    expect(response.payload).toHaveProperty("insights");
    expect(response.payload).toHaveProperty("analytics");
    expect(response.payload).toHaveProperty("patterns");
  });

  it("copies the requestId through the response", () => {
    send(request("req-42"));
    expect((postedResponses[0] as { requestId: string }).requestId).toBe(
      "req-42",
    );
  });

  it("reports an error for an unsupported request type", () => {
    send({ type: "unknown", requestId: "req-x" });
    const response = postedResponses[0] as { type: string; error: unknown };
    expect(response.type).toBe("error");
    expect(response.error).toHaveProperty("code");
  });

  it("handles an empty dataset", () => {
    send(request("req-empty"));
    const response = postedResponses[0] as {
      payload: { insights: unknown[] };
    };
    expect(response.payload.insights).toHaveLength(1);
  });
});
