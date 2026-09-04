"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  speechRecognitionService,
  type SpeechRecognitionState,
} from "../services/speech-recognition.service";
import { speechRecognitionSupported } from "../capabilities/speech-recognition";

/**
 * React hook for the Speech Recognition feature.
 *
 * Wraps `SpeechRecognitionService` and exposes a controlled state plus
 * handlers so widgets can render a microphone button and a clear "listening"
 * state. The microphone is only started through `start()`, which must be called
 * from a user gesture.
 */
export function useSpeechRecognition(): {
  state: SpeechRecognitionState;
  supported: boolean;
  transcript: string;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  onUserTranscript: (transcript: string) => void;
  resultRef: RefObject<string>;
} {
  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [transcript, setTranscript] = useState("");
  const resultRef = useRef("");

  useEffect(() => {
    speechRecognitionService.setHandlers({
      onStateChange: setState,
      onResult: (text, isFinal) => {
        if (isFinal) {
          resultRef.current += text;
          setTranscript(resultRef.current.trim());
        } else {
          setTranscript((prev) => (prev ? `${prev} ${text}`.trim() : text));
        }
      },
      onError: () => {
        setState("error");
      },
    });
    return () => {
      speechRecognitionService.setHandlers({});
    };
  }, []);

  const start = useCallback(() => {
    resultRef.current = "";
    setTranscript("");
    speechRecognitionService.start();
  }, []);

  const stop = useCallback(() => {
    speechRecognitionService.stop();
  }, []);

  const abort = useCallback(() => {
    speechRecognitionService.abort();
  }, []);

  const reset = useCallback(() => {
    resultRef.current = "";
    setTranscript("");
    setState("idle");
  }, []);

  const onUserTranscript = useCallback((text: string) => {
    resultRef.current = text;
    setTranscript(text);
  }, []);

  return {
    state,
    supported: speechRecognitionSupported(),
    transcript,
    isListening: state === "listening" || state === "starting",
    start,
    stop,
    abort,
    reset,
    onUserTranscript,
    resultRef,
  };
}