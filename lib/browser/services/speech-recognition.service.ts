/**
 * SpeechRecognitionService
 *
 * Encapsulates the (non-standard, vendor-prefixed) Speech Recognition API so UI
 * and widgets never touch `webkitSpeechRecognition` directly. It models explicit
 * recognition states and routes text only to the caller (never stores audio).
 *
 * Privacy contract:
 * - no audio is stored or sent to any backend;
 * - only the resulting text is delivered to the caller on confirmation;
 * - the microphone is only started after an explicit user action.
 */

import { speechRecognitionSupported } from "../capabilities/speech-recognition";
import { isBrowser } from "../environment";

export type SpeechRecognitionState =
  | "idle"
  | "starting"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export type SpeechRecognitionEventHandlers = {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: SpeechRecognitionState) => void;
  onError?: (reason: string) => void;
  onEnd?: () => void;
};

export type SpeechRecognitionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult?: (event: unknown) => void;
  onerror?: (event: unknown) => void;
  onend?: () => void;
  onstart?: () => void;
  onaudiostart?: () => void;
  onspeechstart?: () => void;
};

const DEFAULT_LANG = "pt-BR";

class SpeechRecognitionService {
  private recognition: SpeechRecognitionLike | null = null;
  private state: SpeechRecognitionState = "idle";
  private handlers: SpeechRecognitionEventHandlers = {};

  isSupported(): boolean {
    return speechRecognitionSupported();
  }

  getState(): SpeechRecognitionState {
    return this.state;
  }

  setHandlers(handlers: SpeechRecognitionEventHandlers): void {
    this.handlers = handlers;
  }

  private setState(next: SpeechRecognitionState): void {
    this.state = next;
    this.handlers.onStateChange?.(next);
  }

  /**
   * Start listening. MUST be called from a user gesture. No-op when the API is
   * not supported.
   */
  start(options: SpeechRecognitionOptions = {}): void {
    if (!this.isSupported() || !isBrowser) {
      this.setState("unsupported");
      this.handlers.onError?.("unsupported");
      return;
    }

    if (this.state === "listening" || this.state === "starting") return;

    this.setState("starting");

    const ctor = this.resolveConstructor();
    if (!ctor) {
      this.setState("unsupported");
      this.handlers.onError?.("unsupported");
      return;
    }

    const instance = new ctor();
    instance.lang = options.lang ?? DEFAULT_LANG;
    instance.continuous = options.continuous ?? false;
    instance.interimResults = options.interimResults ?? true;

    instance.onstart = () => this.setState("listening");
    instance.onspeechstart = () => this.setState("listening");
    instance.onaudiostart = () => this.setState("listening");
    instance.onend = () => {
      this.setState("idle");
      this.handlers.onEnd?.();
    };

    instance.onresult = (event: unknown) => {
      this.setState("processing");
      const result = this.extractTranscript(event);
      if (result.final) {
        this.handlers.onResult?.(result.transcript, true);
      } else {
        this.handlers.onResult?.(result.transcript, false);
      }
    };

    instance.onerror = (event: unknown) => {
      const reason = this.mapError(event);
      this.setState("error");
      this.handlers.onError?.(reason);
    };

    this.recognition = instance;

    try {
      instance.start();
    } catch {
      this.setState("error");
      this.handlers.onError?.("start-failed");
    }
  }

  /** Stop listening but keep processing any pending result. */
  stop(): void {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // best-effort
    }
  }

  /** Abort recognition immediately. */
  abort(): void {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {
      // best-effort
    }
  }

  private resolveConstructor(): (new () => SpeechRecognitionLike) | null {
    const target = window as unknown as Record<string, unknown>;
    const ctor = (target.SpeechRecognition ??
      target.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;
    return ctor ?? null;
  }

  private extractTranscript(event: unknown): {
    transcript: string;
    final: boolean;
  } {
    const resultEvent = event as {
      results?: ArrayLike<
        ArrayLike<{ transcript?: string }> & { isFinal?: boolean }
      >;
    };
    const results = resultEvent?.results;
    if (!results || results.length === 0) {
      return { transcript: "", final: false };
    }
    const lastIndex = results.length - 1;
    const last = results[lastIndex];
    const transcript = Array.from(last)
      .map((alt) => alt.transcript ?? "")
      .join("");
    return { transcript, final: !!last.isFinal };
  }

  private mapError(event: unknown): string {
    const errorEvent = event as { error?: string };
    switch (errorEvent?.error) {
      case "not-allowed":
      case "service-not-allowed":
        return "permission-denied";
      case "audio-capture":
      case "no-speech":
        return "mic-unavailable";
      default:
        return "recognition-error";
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();

export type SpeechRecognitionServiceInstance = SpeechRecognitionService;