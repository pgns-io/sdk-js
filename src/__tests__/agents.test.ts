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

import { describe, it, expect } from 'vitest';
import {
  CORRELATION_ID_HEADER,
  validateCorrelationId,
  correlationHeaders,
  extractCorrelationId,
} from '../agents.js';

describe('validateCorrelationId', () => {
  it('accepts a simple alphanumeric ID', () => {
    expect(validateCorrelationId('abc-123')).toBe(true);
  });

  it('accepts printable ASCII characters', () => {
    expect(validateCorrelationId('req_!@#$%^&*()')).toBe(true);
  });

  it('accepts max length (128 chars)', () => {
    expect(validateCorrelationId('a'.repeat(128))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateCorrelationId('')).toBe(false);
  });

  it('rejects string exceeding 128 characters', () => {
    expect(validateCorrelationId('a'.repeat(129))).toBe(false);
  });

  it('rejects string containing spaces', () => {
    expect(validateCorrelationId('has space')).toBe(false);
  });

  it('rejects non-ASCII characters', () => {
    expect(validateCorrelationId('café')).toBe(false);
  });
});

describe('correlationHeaders', () => {
  it('returns header record for a valid ID', () => {
    expect(correlationHeaders('req-123')).toEqual({
      [CORRELATION_ID_HEADER]: 'req-123',
    });
  });

  it('returns empty object for null', () => {
    expect(correlationHeaders(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(correlationHeaders(undefined)).toEqual({});
  });

  it('returns empty object for an invalid ID', () => {
    expect(correlationHeaders('has space')).toEqual({});
  });

  it('is safely spreadable into existing headers', () => {
    const headers = { 'Content-Type': 'application/json', ...correlationHeaders('cid-1') };
    expect((headers as Record<string, string>)[CORRELATION_ID_HEADER]).toBe('cid-1');
  });
});

describe('extractCorrelationId', () => {
  it('extracts pgns native header', () => {
    const headers = { 'X-Pgns-CorrelationId': 'pgns-123' };
    expect(extractCorrelationId(headers)).toBe('pgns-123');
  });

  it('falls back to X-Correlation-ID', () => {
    const headers = { 'X-Correlation-ID': 'corr-456' };
    expect(extractCorrelationId(headers)).toBe('corr-456');
  });

  it('falls back to X-Request-ID', () => {
    const headers = { 'X-Request-ID': 'req-789' };
    expect(extractCorrelationId(headers)).toBe('req-789');
  });

  it('respects priority order (pgns > correlation > request)', () => {
    const headers = {
      'X-Pgns-CorrelationId': 'pgns-first',
      'X-Correlation-ID': 'corr-second',
      'X-Request-ID': 'req-third',
    };
    expect(extractCorrelationId(headers)).toBe('pgns-first');
  });

  it('performs case-insensitive lookup on plain objects', () => {
    const headers = { 'x-pgns-correlationid': 'lower-case' };
    expect(extractCorrelationId(headers)).toBe('lower-case');
  });

  it('returns null when no recognized header is present', () => {
    const headers = { 'Content-Type': 'application/json' };
    expect(extractCorrelationId(headers)).toBeNull();
  });

  it('returns null for invalid pgns header value', () => {
    const headers = { 'X-Pgns-CorrelationId': 'has space' };
    expect(extractCorrelationId(headers)).toBeNull();
  });

  it('skips invalid fallback and tries next candidate', () => {
    const headers = {
      'X-Correlation-ID': 'has space',
      'X-Request-ID': 'valid-req-id',
    };
    expect(extractCorrelationId(headers)).toBe('valid-req-id');
  });

  it('returns null when invalid pgns header blocks fallbacks', () => {
    const headers = {
      'X-Pgns-CorrelationId': 'has space',
      'X-Request-ID': 'valid-req-id',
    };
    expect(extractCorrelationId(headers)).toBeNull();
  });

  it('works with the Web Headers API', () => {
    const headers = new Headers({ 'X-Pgns-CorrelationId': 'from-headers-api' });
    expect(extractCorrelationId(headers)).toBe('from-headers-api');
  });
});
