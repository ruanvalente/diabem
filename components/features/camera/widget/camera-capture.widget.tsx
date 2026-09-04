"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/lib/browser/hooks/use-camera";
import { cameraService } from "@/lib/browser/services/camera.service";
import { Camera, CameraOff, Loader2, RotateCcw } from "lucide-react";

type CameraCaptureResult = {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
};

type CameraCaptureProps = {
  onCapture: (result: CameraCaptureResult) => void;
  onCancel: () => void;
  label?: string;
};

/**
 * A progressive-enhancement camera capture component.
 *
 * - Only renders when Camera API is supported (callers check).
 * - Starts the camera on explicit user action.
 * - Displays a preview and captures a frame on demand.
 * - Cleans up tracks on unmount/cancel.
 * - Mobile-first: portrait, playsInline, touch-friendly controls.
 */
export function CameraCapture({
  onCapture,
  onCancel,
  label = "Câmera",
}: CameraCaptureProps) {
  const { state, supported, stream, error, start, stop } = useCamera();
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Câmera não disponível neste dispositivo ou navegador.
        </p>
      </div>
    );
  }

  const handleStart = async () => {
    await start();
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    const result = await cameraService.capture();
    setIsCapturing(false);
    if (result.ok) {
      setCapturedDataUrl(result.dataUrl);
      setCapturedBlob(result.blob);
    }
  };

  const handleConfirm = () => {
    if (capturedDataUrl && capturedBlob) {
      const video = document.querySelector("video");
      onCapture({
        dataUrl: capturedDataUrl,
        blob: capturedBlob,
        width: video?.videoWidth ?? 0,
        height: video?.videoHeight ?? 0,
      });
    }
    stop();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
  };

  const handleCancel = () => {
    stop();
    onCancel();
  };

  const isIdle = state === "idle";
  const isStreaming = state === "streaming";
  const hasCaptured = capturedDataUrl !== null;

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Camera status */}
      <div className="flex items-center justify-between px-4 py-3">
        <p role="status" aria-live="polite" className="text-sm font-medium text-foreground">
          {isIdle && "Câmera pronta"}
          {state === "starting" && "Iniciando câmera…"}
          {isStreaming && !hasCaptured && "Câmera ativa — pronto para capturar"}
          {hasCaptured && "Imagem capturada"}
          {state === "error" && "Erro ao acessar câmera"}
        </p>
        {isStreaming && !hasCaptured && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="size-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
            Ativa
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-destructive">
          {error === "permission-denied"
            ? "Permissão da câmera negada. Verifique as permissões do navegador."
            : error === "camera-unavailable"
              ? "Nenhuma câmera encontrada neste dispositivo."
              : error === "unsupported"
                ? "Câmera não suportada neste navegador."
                : "Erro ao acessar a câmera."}
        </p>
      )}

      {/* Preview / Captured image */}
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
        {hasCaptured && capturedDataUrl && (
          <img
            src={capturedDataUrl}
            alt="Imagem capturada"
            className="h-full w-full object-cover"
          />
        )}
        {isIdle && !hasCaptured && (
          <div className="flex h-full items-center justify-center">
            <Camera className="size-12 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 px-4 py-3">
        {isIdle && !hasCaptured && (
          <>
            <Button
              onClick={() => void handleStart()}
              className="h-12 flex-1 text-base"
            >
              <Camera className="size-4" aria-hidden="true" />
              Abrir câmera
            </Button>
            <Button variant="outline" onClick={handleCancel} className="h-12">
              Cancelar
            </Button>
          </>
        )}

        {isStreaming && !hasCaptured && (
          <>
            <Button
              onClick={() => void handleCapture()}
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
            <Button variant="outline" onClick={handleCancel} className="h-12">
              <CameraOff className="size-4" aria-hidden="true" />
              Cancelar
            </Button>
          </>
        )}

        {hasCaptured && (
          <>
            <Button
              onClick={handleConfirm}
              className="h-12 flex-1 text-base"
            >
              Confirmar
            </Button>
            <Button
              variant="outline"
              onClick={handleRetake}
              className="h-12"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Tirar novamente
            </Button>
            <Button variant="ghost" onClick={handleCancel} className="h-12">
              Cancelar
            </Button>
          </>
        )}
      </div>
    </section>
  );
}