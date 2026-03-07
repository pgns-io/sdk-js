/** Error thrown by {@link PigeonsClient} when the API returns a non-2xx response. */
export class PigeonsError extends Error {
  /** HTTP status code from the API response. */
  status: number;
  /** Machine-readable error code (e.g. `"ROOST_NOT_FOUND"`). */
  code?: string;

  constructor(message: string, status: number, opts?: { cause?: unknown; code?: string }) {
    super(message, opts?.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = 'PigeonsError';
    this.status = status;
    this.code = opts?.code;
  }
}

export type WebhookVerificationCode =
  | 'MISSING_HEADER'
  | 'INVALID_FORMAT'
  | 'SIGNATURE_MISMATCH'
  | 'TIMESTAMP_EXPIRED';

/** Error thrown by {@link Webhook} when signature verification fails. */
export class WebhookVerificationError extends PigeonsError {
  override code: WebhookVerificationCode;

  constructor(message: string, code: WebhookVerificationCode) {
    super(message, 400, { code });
    this.name = 'WebhookVerificationError';
    this.code = code;
  }
}
