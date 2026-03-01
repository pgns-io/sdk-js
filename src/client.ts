import { PigeonsError } from './errors.js';
import type {
  ApiError,
  ApiKeyCreatedResponse,
  ApiKeyResponse,
  AuthTokens,
  CreateApiKeyRequest,
  CreateDestination,
  CreateRoost,
  DeliveryAttempt,
  Destination,
  Pigeon,
  ReplayResponse,
  Roost,
  UpdateApiKeyRequest,
  UpdateRoost,
} from './types.js';

/** Configuration for {@link PigeonsClient}. */
export interface PigeonsClientConfig {
  /** Base URL of the pgns API (e.g. `"https://api.pgns.io"`). */
  baseUrl: string;
  /** API key (`pk_live_...`) for server-side authentication. */
  apiKey?: string;
  /** JWT access token for browser / user-session authentication. */
  accessToken?: string;
  /** Called after a token refresh so you can persist the new tokens. */
  onTokenRefresh?: (tokens: AuthTokens) => void;
}

/**
 * Framework-agnostic client for the pgns API.
 *
 * Supports two authentication modes:
 * - **API key** — pass `apiKey` in the constructor for server-side usage.
 * - **JWT** — pass `accessToken` directly.
 *   Expired tokens are refreshed automatically on `401`.
 *
 * @example
 * ```ts
 * const client = new PigeonsClient({
 *   baseUrl: "https://api.pgns.io",
 *   apiKey: "pk_live_...",
 * });
 * const roosts = await client.listRoosts();
 * ```
 */
export class PigeonsClient {
  private baseUrl: string;
  private apiKey?: string;
  private accessToken?: string;
  private onTokenRefresh?: (tokens: AuthTokens) => void;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(config: PigeonsClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.onTokenRefresh = config.onTokenRefresh;
  }

  /** Replace the current JWT access token. */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /** Replace the current API key. */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  // -- Internal helpers --

  private authHeader(): Record<string, string> {
    if (this.apiKey) return { Authorization: `Bearer ${this.apiKey}` };
    if (this.accessToken) return { Authorization: `Bearer ${this.accessToken}` };
    return {};
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: res.statusText }))) as ApiError;
      throw new PigeonsError(body.error, res.status);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }

  /** Coalesce concurrent refresh calls into a single request. */
  private async refreshToken(): Promise<AuthTokens> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.unauthRequest<AuthTokens>('/v1/auth/refresh', {
      method: 'POST',
    }).finally(() => {
      this.refreshPromise = null;
    });

    const tokens = await this.refreshPromise;
    this.accessToken = tokens.access_token;
    this.onTokenRefresh?.(tokens);
    return tokens;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeader(),
        ...options.headers,
      },
    });

    if (res.status === 401 && !this.apiKey) {
      try {
        const tokens = await this.refreshToken();

        const retryRes = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.access_token}`,
            ...options.headers,
          },
        });
        return this.handleResponse<T>(retryRes);
      } catch (err) {
        this.accessToken = undefined;
        throw new PigeonsError('Session expired', 401, err);
      }
    }

    return this.handleResponse<T>(res);
  }

  private async unauthRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return this.handleResponse<T>(res);
  }

  // -- Auth --

  /** Refresh the access token. The refresh token is sent via httpOnly cookie. */
  async refresh(): Promise<AuthTokens> {
    const tokens = await this.unauthRequest<AuthTokens>('/v1/auth/refresh', {
      method: 'POST',
    });
    this.accessToken = tokens.access_token;
    this.onTokenRefresh?.(tokens);
    return tokens;
  }

  /** Revoke the refresh token (via cookie) and clear stored credentials on the client. */
  async logout(): Promise<void> {
    await this.request<void>('/v1/auth/logout', {
      method: 'POST',
    });
    this.accessToken = undefined;
  }

  // -- Roosts --

  /** List all roosts for the authenticated user. */
  listRoosts(): Promise<Roost[]> {
    return this.request<Roost[]>('/v1/roosts');
  }

  /** Get a roost by ID. */
  getRoost(roostId: string): Promise<Roost> {
    return this.request<Roost>(`/v1/roosts/${encodeURIComponent(roostId)}`);
  }

  /** Create a new roost (webhook endpoint). */
  createRoost(data: CreateRoost): Promise<Roost> {
    return this.request<Roost>('/v1/roosts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Update a roost's name, description, secret, or active state. */
  updateRoost(roostId: string, data: UpdateRoost): Promise<Roost> {
    return this.request<Roost>(`/v1/roosts/${encodeURIComponent(roostId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /** Delete a roost and all its destinations. */
  deleteRoost(roostId: string): Promise<void> {
    return this.request<void>(`/v1/roosts/${encodeURIComponent(roostId)}`, { method: 'DELETE' });
  }

  // -- Pigeons --

  /**
   * List pigeons, optionally filtered by roost.
   * @param opts.roostId - Restrict results to a single roost. Omit for all roosts.
   * @param opts.limit - Maximum number of results (default: 50).
   */
  listPigeons(opts?: { roostId?: string; limit?: number }): Promise<Pigeon[]> {
    const params = new URLSearchParams();
    if (opts?.roostId) params.set('roost_id', opts.roostId);
    params.set('limit', String(opts?.limit ?? 50));
    return this.request<Pigeon[]>(`/v1/pigeons?${params.toString()}`);
  }

  /** Get a single pigeon by ID, including headers and body. */
  getPigeon(pigeonId: string): Promise<Pigeon> {
    return this.request<Pigeon>(`/v1/pigeons/${encodeURIComponent(pigeonId)}`);
  }

  /** List all delivery attempts for a pigeon. */
  getPigeonDeliveries(pigeonId: string): Promise<DeliveryAttempt[]> {
    return this.request<DeliveryAttempt[]>(
      `/v1/pigeons/${encodeURIComponent(pigeonId)}/deliveries`,
    );
  }

  /** Re-deliver a pigeon to all active destinations. */
  replayPigeon(pigeonId: string): Promise<ReplayResponse> {
    return this.request<ReplayResponse>(`/v1/pigeons/${encodeURIComponent(pigeonId)}/replay`, {
      method: 'POST',
    });
  }

  // -- Destinations --

  /** List all destinations for a roost. */
  listDestinations(roostId: string): Promise<Destination[]> {
    return this.request<Destination[]>(`/v1/roosts/${encodeURIComponent(roostId)}/destinations`);
  }

  /** Get a destination by ID. */
  getDestination(destinationId: string): Promise<Destination> {
    return this.request<Destination>(`/v1/destinations/${encodeURIComponent(destinationId)}`);
  }

  /** Add a new destination (url, slack, discord, or email) to a roost. */
  createDestination(roostId: string, data: CreateDestination): Promise<Destination> {
    return this.request<Destination>(`/v1/roosts/${encodeURIComponent(roostId)}/destinations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Pause or unpause delivery to a destination. */
  pauseDestination(destinationId: string, isPaused: boolean): Promise<{ is_paused: boolean }> {
    return this.request<{ is_paused: boolean }>(
      `/v1/destinations/${encodeURIComponent(destinationId)}/pause`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_paused: isPaused }),
      },
    );
  }

  /** Permanently delete a destination. */
  deleteDestination(destinationId: string): Promise<void> {
    return this.request<void>(`/v1/destinations/${encodeURIComponent(destinationId)}`, {
      method: 'DELETE',
    });
  }

  // -- API Keys --

  /** List all API keys for the authenticated user. */
  listApiKeys(): Promise<ApiKeyResponse[]> {
    return this.request<ApiKeyResponse[]>('/v1/api-keys');
  }

  /** Get an API key by ID. Does not return the full key value. */
  getApiKey(keyId: string): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>(`/v1/api-keys/${encodeURIComponent(keyId)}`);
  }

  /** Create a new API key. The full key is only returned in this response — store it securely. */
  createApiKey(data: CreateApiKeyRequest = {}): Promise<ApiKeyCreatedResponse> {
    return this.request<ApiKeyCreatedResponse>('/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Rename an API key. */
  updateApiKey(keyId: string, data: UpdateApiKeyRequest): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>(`/v1/api-keys/${encodeURIComponent(keyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /** Permanently revoke and delete an API key. */
  deleteApiKey(keyId: string): Promise<void> {
    return this.request<void>(`/v1/api-keys/${encodeURIComponent(keyId)}`, {
      method: 'DELETE',
    });
  }
}
