# Progressive Web APIs — Implementation Reference

This document describes the browser APIs used by Sprint 8, their compatibility,
fallbacks, and the privacy decisions that govern their usage.

---

## Browser APIs Used

### 1. Notifications API

| Aspect | Detail |
|---|---|
| Standard | W3C Notification API |
| Secure context | Required (HTTPS or localhost) |
| Permission | User gesture required to request |
| Key methods | `Notification.requestPermission()`, `new Notification()` |
| SSR safety | `notificationsCapability()` returns `{ supported: false }` during SSR |

**Capabilities**: `lib/browser/capabilities/notifications.ts`
**Service**: `lib/browser/services/notification.service.ts`
**Hook**: `lib/browser/hooks/use-notifications.ts`

### 2. Speech Recognition API (non-standard)

| Aspect | Detail |
|---|---|
| Standard | Non-standard (vendor-prefixed) |
| Prefix | `webkitSpeechRecognition` (Chrome/Edge) |
| Secure context | Required |
| Permission | Implicit (microphone access prompt) |
| SSR safety | `speechRecognitionSupported()` returns `false` during SSR |

**Capabilities**: `lib/browser/capabilities/speech-recognition.ts`
**Service**: `lib/browser/services/speech-recognition.service.ts`
**Hook**: `lib/browser/hooks/use-speech-recognition.ts`
**UI**: `components/features/voice-input/ui/voice-input-button.ui.tsx`

### 3. Camera / MediaDevices API

| Aspect | Detail |
|---|---|
| Standard | W3C Media Capture and Streams |
| Secure context | Required |
| Permission | User gesture required, browser prompt |
| Key methods | `navigator.mediaDevices.getUserMedia()` |
| SSR safety | `cameraSupported()` returns `false` during SSR |

**Capabilities**: `lib/browser/capabilities/camera.ts`
**Service**: `lib/browser/services/camera.service.ts`
**Hook**: `lib/browser/hooks/use-camera.ts`
**UI**: `components/features/camera/widget/camera-capture.widget.tsx`

---

## Browser Compatibility

| API | Chrome | Edge | Firefox | Safari | Samsung Internet |
|---|---|---|---|---|---|
| Notifications | 22+ | 14+ | 22+ | 6+ | 4+ |
| Speech Recognition | 33+ | 79+ | — | — | — |
| Camera (getUserMedia) | 53+ | 12+ | 36+ | 11+ | 6+ |

**Speech Recognition** is only available in Chromium-based browsers. Firefox and
Safari do not expose any vendor-prefixed variant. The UI degrades gracefully by
hiding the voice input button when the API is not detected.

---

## Fallback Strategy

Every Progressive Web API follows the same principle: **no API is mandatory**.

| API | Fallback when unsupported |
|---|---|
| Notifications | Silent in-app reminders only (no OS notification) |
| Speech Recognition | Keyboard/manual text input remains available |
| Camera | Manual photo selection or no image attachment |

The capability detection layer (`lib/browser/capabilities/`) provides a boolean
`supported` flag that widgets use to conditionally render feature controls.

---

## Privacy Decisions

### Notifications

- Reminders use generic, non-sensitive titles (e.g., "Time for your medication")
- No health data (glucose values, meals, etc.) is included in notification body
- Permission is only requested on explicit user action (button click)
- Notifications are only delivered while the app is open (no Background Sync)

### Speech Recognition

- Audio is never stored or transmitted to any backend
- Only the final text transcript is delivered to the calling component
- The microphone is only activated after an explicit user action
- Interim results are displayed locally and discarded

### Camera

- Camera stream is only activated on explicit user action
- Tracks are stopped immediately after capture or on component unmount
- Camera is automatically stopped when the tab becomes hidden
- Images are captured client-side; no image is sent to any server automatically

### localStorage Reminders

- Reminder data is stored locally in `localStorage`
- Reminder content is intentionally generic (no health data)
- Maximum 50 reminders per device
- Reminders are device-scoped; no sync across devices

---

## Architecture Notes

### Abstraction Layers

```
UI Components (widgets)
    ↓
React Hooks (use-notification-permission, use-speech-recognition, use-camera)
    ↓
Services (NotificationService, SpeechRecognitionService, CameraService)
    ↓
Browser APIs (Notification, SpeechRecognition, MediaDevices)
```

UI components MUST NOT call browser APIs directly. All browser interaction goes
through the service layer.

### SSR Safety

Every capability function and service method checks `isBrowser` before accessing
any browser global. This ensures safe import and evaluation during server-side
rendering.

### Permission Policy

The `next.config.ts` Permissions-Policy header is configured with:
```
camera=self, microphone=self
```

This allows the app to use camera and microphone while blocking third-party
embedding from accessing these APIs.

---

## File Reference

```
lib/browser/
├── capabilities/          # Capability detection (SSR-safe)
│   ├── notifications.ts
│   ├── speech-recognition.ts
│   ├── camera.ts
│   └── index.ts           # Combined capabilities
├── services/              # Browser API abstraction
│   ├── notification.service.ts
│   ├── speech-recognition.service.ts
│   ├── camera.service.ts
│   ├── notification.types.ts
│   └── index.ts
├── hooks/                 # React hooks
│   ├── use-notifications.ts
│   ├── use-speech-recognition.ts
│   ├── use-camera.ts
│   └── use-browser-capabilities.ts
├── reminders/             # localStorage reminder persistence
│   ├── reminder.service.ts
│   └── index.ts
└── environment.ts         # SSR-safe environment detection
```
