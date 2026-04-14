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

const DEFAULT_RETRY_DELAY = 3000;

/** Options for {@link createEventSource}. */
export interface EventSourceOptions {
  /** Bearer token for authentication. */
  token?: string;
  /** Restrict the stream to pigeons for a single roost. Omit for all roosts. */
  roostId?: string;
  /** Abort signal to stop the connection. */
  signal?: AbortSignal;
  /** Called for each SSE `data:` line received. */
  onEvent: (data: string) => void;
  /** Called when a connection error occurs (before automatic reconnect). */
  onError?: (err: Error) => void;
}

/**
 * Connect to the Pgns SSE event stream using `fetch` + `ReadableStream`.
 *
 * Automatically reconnects on failure with a 3-second delay. On reconnect
 * the `Last-Event-ID` header is sent so the server can replay missed events.
 * Cancel the connection by aborting the signal passed in `opts`.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * createEventSource("https://api.pgns.io", {
 *   token: "eyJhbG...",
 *   signal: controller.signal,
 *   onEvent(data) { console.log(data); },
 * });
 * // later: controller.abort();
 * ```
 */
export async function createEventSource(baseUrl: string, opts: EventSourceOptions): Promise<void> {
  const url = opts.roostId
    ? `${baseUrl}/v1/events?roost_id=${encodeURIComponent(opts.roostId)}`
    : `${baseUrl}/v1/events`;

  let lastEventId: string | undefined;

  while (!opts.signal?.aborted) {
    try {
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
      };
      if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
      if (lastEventId) headers['Last-Event-ID'] = lastEventId;

      const res = await fetch(url, {
        headers,
        signal: opts.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE connect failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!opts.signal?.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('id:')) {
            lastEventId = line.slice(3).trim();
          } else if (line.startsWith('data:')) {
            opts.onEvent(line.slice(5).trim());
          }
        }
      }
    } catch (err) {
      if (opts.signal?.aborted) break;
      if (err instanceof DOMException && err.name === 'AbortError') break;
      opts.onError?.(err instanceof Error ? err : new Error(String(err)));
    }

    if (opts.signal?.aborted) break;
    await new Promise((r) => setTimeout(r, DEFAULT_RETRY_DELAY));
  }
}
