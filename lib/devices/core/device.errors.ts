/**
 * Device integration error taxonomy.
 *
 * Raw browser/hardware errors (e.g. "GATT Error 133") must never be shown to
 * the user. Each adapter maps low-level failures onto a `DeviceErrorCode`, and
 * `toFriendlyMessage` converts those codes into conservative, user-friendly
 * PT-BR messages suitable for the UI.
 */

/**
 * Canonical device error codes shared across adapters.
 */
export type DeviceErrorCode =
  | "device-not-found"
  | "permission-denied"
  | "connection-failed"
  | "connection-lost"
  | "unsupported-device"
  | "unsupported-browser"
  | "invalid-data"
  | "malformed-packet"
  | "sync-failed"
  | "unknown";

export type DeviceErrorInit = {
  code: DeviceErrorCode;
  message?: string;
  cause?: unknown;
};

/**
 * Typed error thrown by device adapters and the integration service. Carries a
 * stable code so the UI can react consistently without inspecting stack traces.
 */
export class DeviceError extends Error {
  readonly code: DeviceErrorCode;
  readonly cause?: unknown;

  constructor(init: DeviceErrorInit) {
    super(init.message ?? defaultMessage(init.code));
    this.name = "DeviceError";
    this.code = init.code;
    this.cause = init.cause;
  }
}

const MESSAGES: Record<DeviceErrorCode, string> = {
  "device-not-found":
    "Não foi possível encontrar o dispositivo. Verifique se ele está ligado e próximo.",
  "permission-denied":
    "A permissão para acessar o dispositivo foi negada. Você pode tentar novamente quando quiser.",
  "connection-failed":
    "Não foi possível conectar ao dispositivo. Verifique se ele está ligado e próximo ao computador.",
  "connection-lost":
    "A conexão com o dispositivo foi perdida. Tente novamente.",
  "unsupported-device":
    "Este dispositivo não é compatível com a conexão neste navegador.",
  "unsupported-browser":
    "Seu navegador não oferece suporte a conexões com este tipo de dispositivo.",
  "invalid-data":
    "Os dados recebidos do dispositivo não são válidos.",
  "malformed-packet":
    "Os dados do dispositivo estão incompletos ou corrompidos.",
  "sync-failed":
    "Não foi possível sincronizar com o dispositivo. Tente novamente.",
  unknown: "Ocorreu um erro inesperado ao acessar o dispositivo.",
};

export function defaultMessage(code: DeviceErrorCode): string {
  return MESSAGES[code];
}

/** Human-friendly helper used by the UI. */
export function toFriendlyMessage(error: unknown): string {
  if (error instanceof DeviceError) {
    return error.message;
  }
  return MESSAGES.unknown;
}
