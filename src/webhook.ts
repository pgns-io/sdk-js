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

import { WebhookVerificationError } from './errors.js';

const DEFAULT_TOLERANCE_SECONDS = 300;

export interface WebhookOptions {
  toleranceInSeconds?: number;
}

export class Webhook {
  private readonly secret: string;
  private readonly toleranceInSeconds: number;

  constructor(secret: string, opts?: WebhookOptions) {
    this.secret = secret;
    this.toleranceInSeconds = opts?.toleranceInSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  }

  async verify(body: string, headers: Record<string, string>): Promise<unknown> {
    const get = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === lower) return headers[key];
      }
      return undefined;
    };

    const webhookSig = get('webhook-signature');
    if (webhookSig !== undefined) {
      return this.verifyStandardWebhooks(body, get, webhookSig);
    }

    const pigeonSig = get('x-pigeon-signature');
    if (pigeonSig !== undefined) {
      return this.verifyLegacy(body, get, pigeonSig);
    }

    throw new WebhookVerificationError('No signature header found', 'MISSING_HEADER');
  }

  private async verifyStandardWebhooks(
    body: string,
    get: (name: string) => string | undefined,
    sigHeader: string,
  ): Promise<unknown> {
    const b64Sig = sigHeader.startsWith('v1,') ? sigHeader.slice(3) : undefined;
    if (!b64Sig) {
      throw new WebhookVerificationError(
        'Invalid webhook-signature format: missing v1, prefix',
        'INVALID_FORMAT',
      );
    }

    const msgId = get('webhook-id');
    if (!msgId) {
      throw new WebhookVerificationError('Missing webhook-id header', 'MISSING_HEADER');
    }

    const timestamp = get('webhook-timestamp');
    if (!timestamp) {
      throw new WebhookVerificationError('Missing webhook-timestamp header', 'MISSING_HEADER');
    }

    this.checkTimestamp(timestamp);

    const keyBytes = this.decodeSecret();
    const encoder = new TextEncoder();
    const signedPayload = encoder.encode(`${msgId}.${timestamp}.${body}`);
    const mac = await this.computeHmacSha256(keyBytes, signedPayload);
    const expected = btoa(String.fromCharCode(...mac));

    if (!this.timingSafeEqual(encoder.encode(expected), encoder.encode(b64Sig))) {
      throw new WebhookVerificationError('Signature mismatch', 'SIGNATURE_MISMATCH');
    }

    return JSON.parse(body) as unknown;
  }

  private async verifyLegacy(
    body: string,
    get: (name: string) => string | undefined,
    sigHeader: string,
  ): Promise<unknown> {
    const hexDigest = sigHeader.startsWith('sha256=') ? sigHeader.slice(7) : undefined;
    if (!hexDigest) {
      throw new WebhookVerificationError(
        'Invalid X-Pigeon-Signature format: missing sha256= prefix',
        'INVALID_FORMAT',
      );
    }

    const timestamp = get('x-pigeon-timestamp');
    if (timestamp) {
      this.checkTimestamp(timestamp);
    }

    const keyBytes = this.decodeSecret();
    const encoder = new TextEncoder();
    const payload = timestamp ? `${timestamp}.${body}` : body;
    const signedPayload = encoder.encode(payload);
    const mac = await this.computeHmacSha256(keyBytes, signedPayload);
    const expected = Array.from(mac)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (!this.timingSafeEqual(encoder.encode(expected), encoder.encode(hexDigest))) {
      throw new WebhookVerificationError('Signature mismatch', 'SIGNATURE_MISMATCH');
    }

    return JSON.parse(body) as unknown;
  }

  private decodeSecret(): Uint8Array {
    const encoder = new TextEncoder();
    if (this.secret.startsWith('whsec_')) {
      const b64 = this.secret.slice(6);
      const raw = atob(b64);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      return buf;
    }
    if (this.secret.length === 64 && /^[0-9a-fA-F]{64}$/.test(this.secret)) {
      const buf = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        buf[i] = parseInt(this.secret.slice(i * 2, i * 2 + 2), 16);
      }
      return buf;
    }
    return encoder.encode(this.secret);
  }

  private checkTimestamp(ts: string): void {
    const timestamp = parseInt(ts, 10);
    if (isNaN(timestamp)) {
      throw new WebhookVerificationError('Invalid timestamp', 'INVALID_FORMAT');
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > this.toleranceInSeconds) {
      throw new WebhookVerificationError('Timestamp outside tolerance', 'TIMESTAMP_EXPIRED');
    }
  }

  private async computeHmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyBytes) as Uint8Array<ArrayBuffer>,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign(
      'HMAC',
      key,
      new Uint8Array(data) as Uint8Array<ArrayBuffer>,
    );
    return new Uint8Array(sig);
  }

  private timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    return result === 0;
  }
}
