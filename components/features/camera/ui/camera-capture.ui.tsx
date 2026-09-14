"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2, RotateCcw } from "lucide-react";
import type { CameraState } from "@/lib/browser/hooks/use-camera";
import type { CameraErrorReason } from "@/lib/browser/services/camera.service";
import type { CameraCaptureResult } from "../types/camera-capture.types";

type CameraCaptureUIProps = {
  label: string;
  supported: boolean;
  state: CameraState;
  stream: MediaStream | null;
  error: CameraErrorReason | null;
  captured: CameraCaptureResult | null;
  isCapturing: boolean;
  onStart: () => void;
  onCapture: () => void;
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
};

export function getCameraErrorMessage(reason: CameraErrorReason): string {
  switch (reason) {
    case "permission-denied":
      return "Permissão da câmera negada. Verifique as permissões do navegador.";
    case "camera-unavailable":
      return "Nenhuma câmera encontrada neste dispositivo.";
    case "unsupported":
      return "Câmera não suportada neste navegador.";
    default:
      return "Erro ao acessar a câmera.";
  }
}

export function CameraCaptureUI({
  label,
  supported,
  state,
  stream,
  error,
  captured,
  isCapturing,
  onStart,
  onCapture,
  onConfirm,
  onRetake,
  onCancel,
}: CameraCaptureUIProps) {
  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Câmera não disponível neste dispositivo ou navegador.
        </p>
      </div>
    );
  }

  const isIdle = state === "idle";
  const isStreaming = state === "streaming";
  const hasCaptured = captured !== null;

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p
          role="status"
          aria-live="polite"
          className="text-sm font-medium text-foreground"
        >
          {isIdle && "Câmera pronta"}
          {state === "starting" && "Iniciando câmera…"}
          {isStreaming && !hasCaptured && "Câmera ativa — pronto para capturar"}
          {hasCaptured && "Imagem capturada"}
          {state === "error" && "Erro ao acessar câmera"}
        </p>
        {isStreaming && !hasCaptured && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span
              className="size-2 animate-pulse rounded-full bg-success"
              aria-hidden="true"
            />
            Ativa
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-destructive">
          {getCameraErrorMessage(error)}
        </p>
      )}

      <div className="relative aspect-video w-full bg-black/5">
        {isStreaming && !hasCaptured && stream && (
          <video
            ref={(videoEl) => {
              if (videoEl && stream) {
                videoEl.srcObject = stream;
                void videoEl.play();
              }
            }}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
        )}
        {hasCaptured && captured && (
          <Image
            src={captured.dataUrl}
            alt="Imagem capturada"
            fill
            sizes="100vw"
            unoptimized
            className="object-cover"
          />
        )}
        {isIdle && !hasCaptured && (
          <div className="flex h-full items-center justify-center">
            <Camera
              className="size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 py-3">
        {isIdle && !hasCaptured && (
          <>
            <Button
              onClick={() => void onStart()}
              className="h-12 flex-1 text-base"
            >
              <Camera className="size-4" aria-hidden="true" />
              Abrir câmera
            </Button>
            <Button variant="outline" onClick={onCancel} className="h-12">
              Cancelar
            </Button>
          </>
        )}

        {isStreaming && !hasCaptured && (
          <>
            <Button
              onClick={() => void onCapture()}
              disabled={isCapturing}
              className="h-12 flex-1 text-base"
            >
              {isCapturing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-4" aria-hidden="true" />
              )}
              Capturar
            </Button>
            <Button variant="outline" onClick={onCancel} className="h-12">
              <CameraOff className="size-4" aria-hidden="true" />
              Cancelar
            </Button>
          </>
        )}

        {hasCaptured && (
          <>
            <Button onClick={onConfirm} className="h-12 flex-1 text-base">
              Confirmar
            </Button>
            <Button variant="outline" onClick={onRetake} className="h-12">
              <RotateCcw className="size-4" aria-hidden="true" />
              Tirar novamente
            </Button>
            <Button variant="ghost" onClick={onCancel} className="h-12">
              Cancelar
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
