/**
 * Backup-related types.
 *
 * For the MVP, backup = export (JSON/CSV in plaintext).
 * Encrypted backup is deferred to a future sprint.
 */

export type BackupWarning = {
  message: string;
};

export const BACKUP_WARNING: BackupWarning = {
  message:
    "Este arquivo contém seus dados pessoais de saúde. Armazene-o em um local seguro e protegido.",
};

export const SHARE_CONFIRMATION_MESSAGE =
  "Este arquivo contém dados pessoais. Deseja continuar?";
