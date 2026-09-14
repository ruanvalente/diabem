export type CameraCaptureResult = {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
};

export type CameraCaptureProps = {
  onCapture: (result: CameraCaptureResult) => void;
  onCancel: () => void;
  label?: string;
};
