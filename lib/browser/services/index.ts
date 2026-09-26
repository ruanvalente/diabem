export {
  notificationService,
} from "./notification.service";
export type {
  NotifyResult,
  NotificationFailureReason,
  NotificationPayload,
  NotificationTransport,
  RequestPermissionResult,
} from "./notification.types";
export type { NotificationPermissionState } from "../capabilities/notifications";

export {
  speechRecognitionService,
} from "./speech-recognition.service";
export type {
  SpeechRecognitionEventHandlers,
  SpeechRecognitionOptions,
  SpeechRecognitionServiceInstance,
  SpeechRecognitionState,
} from "./speech-recognition.service";

export {
  cameraService,
} from "./camera.service";
export type {
  CameraErrorReason,
  CameraResult,
  CameraServiceInstance,
  CameraStartResult,
} from "./camera.service";