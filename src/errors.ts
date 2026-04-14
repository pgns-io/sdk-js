// Copyright (c) 2026 PGNS LLC
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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
