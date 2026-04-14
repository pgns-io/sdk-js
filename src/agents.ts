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

/**
 * Agent pattern helpers for correlation ID propagation and validation.
 *
 * @example
 * ```ts
 * import { extractCorrelationId, correlationHeaders } from '@pgns/sdk/agents';
 *
 * // Extract from inbound request
 * const cid = extractCorrelationId(request.headers);
 *
 * // Forward to outbound call
 * fetch(url, { headers: { ...correlationHeaders(cid) } });
 * ```
 */

/** Header name used by pgns for correlation ID propagation. */
export const CORRELATION_ID_HEADER = 'X-Pgns-CorrelationId';

/** Printable ASCII, 1–128 characters — the server-enforced format. */
const CORRELATION_ID_RE = /^[\x21-\x7E]{1,128}$/;

/** Headers checked (in order) when the primary header is absent. */
const FALLBACK_HEADERS = ['X-Correlation-ID', 'X-Request-ID'] as const;

/** Return `true` if `cid` matches the pgns correlation ID format. */
export function validateCorrelationId(cid: string): boolean {
  return CORRELATION_ID_RE.test(cid);
}

/**
 * Build a headers record containing `X-Pgns-CorrelationId` if the value is valid.
 *
 * Returns an empty object when the value is `null`/`undefined` or fails validation,
 * so callers can safely spread the result into an existing headers object.
 */
export function correlationHeaders(
  correlationId: string | null | undefined,
): Record<string, string> {
  if (correlationId != null && validateCorrelationId(correlationId)) {
    return { [CORRELATION_ID_HEADER]: correlationId };
  }
  return {};
}

/**
 * Extract a correlation ID from a headers object.
 *
 * Checks the following headers in priority order:
 * 1. `X-Pgns-CorrelationId` (pgns native)
 * 2. `X-Correlation-ID` (common convention)
 * 3. `X-Request-ID` (fallback)
 *
 * Header lookup is case-insensitive. Returns `null` if no header is
 * present or the value fails validation.
 */
export function extractCorrelationId(
  headers: Record<string, string | undefined> | Headers,
): string | null {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) ?? undefined;
    }
    // Case-insensitive lookup over plain objects
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower) return v;
    }
    return undefined;
  };

  for (const name of [CORRELATION_ID_HEADER, ...FALLBACK_HEADERS]) {
    const value = get(name);
    if (value !== undefined) {
      if (validateCorrelationId(value)) return value;
      if (name === CORRELATION_ID_HEADER) return null;
      // else continue to next fallback
    }
  }
  return null;
}
