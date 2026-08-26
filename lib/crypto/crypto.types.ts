export type PasswordDerivation = {
  hash: string;
  salt: string;
};

export type CryptoOperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
