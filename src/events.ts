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
 * Automatically reconnects on failure with a 3-second delay. Cancel the
 * connection by aborting the signal passed in `opts`.
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

  while (!opts.signal?.aborted) {
    try {
      const res = await fetch(url, {
        headers: {
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          Accept: 'text/event-stream',
        },
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
          if (line.startsWith('data:')) {
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
