# @pgns/core

TypeScript SDK for the pgns API. Framework-agnostic — works in Node.js, Deno, Bun, edge runtimes, and the browser.

## Install

```bash
npm install @pgns/core
# or
pnpm add @pgns/core
```

## Quick Start

### With an API key (server-side)

```ts
import { PigeonsClient } from "@pgns/core";

const client = new PigeonsClient({
  baseUrl: "https://api.pgns.io",
  apiKey: "pk_live_...",
});

const roosts = await client.listRoosts();
```

### With user authentication (browser)

```ts
import { PigeonsClient } from "@pgns/core";

const client = new PigeonsClient({
  baseUrl: "https://api.pgns.io",
  onTokenRefresh(tokens) {
    // Persist new tokens however you like
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  },
});

await client.login({ email: "user@example.com", password: "..." });
const roosts = await client.listRoosts();
```

## Authentication

The client supports two authentication modes:

| Mode | Use case | How |
|------|----------|-----|
| **API key** | Server-side / scripts | Pass `apiKey` to the constructor |
| **JWT** | Browser / user sessions | Call `login()` / `signup()`, or pass `accessToken` to the constructor |

When using JWT auth the client automatically retries on `401` by refreshing the token. Supply `onTokenRefresh` to persist new tokens.

You can switch credentials at any time:

```ts
client.setApiKey("pk_live_new_key");
// or
client.setAccessToken("eyJhbG...");
```

## Roosts

Roosts are webhook endpoints that receive incoming requests and route them to destinations.

```ts
// Create
const roost = await client.createRoost({
  name: "GitHub Webhooks",
  description: "Receives push events",
  secret: "whsec_...",       // optional HMAC verification secret
});

// List all
const roosts = await client.listRoosts();

// Get by ID
const roost = await client.getRoost("rst_01J...");

// Update
await client.updateRoost("rst_01J...", { name: "Renamed" });

// Delete
await client.deleteRoost("rst_01J...");
```

## Pigeons

Pigeons are individual webhook requests captured by a roost.

```ts
// List pigeons for a roost (default limit: 50)
const pigeons = await client.listPigeons({ roostId: "rst_01J..." });

// List all pigeons across roosts
const all = await client.listPigeons();

// With custom limit
const recent = await client.listPigeons({ roostId: "rst_01J...", limit: 10 });

// Get a single pigeon
const pigeon = await client.getPigeon("pgn_01J...");

// Get delivery attempts for a pigeon
const deliveries = await client.getPigeonDeliveries("pgn_01J...");

// Replay a pigeon (re-deliver to all destinations)
const result = await client.replayPigeon("pgn_01J...");
// => { replayed: true, pigeon_id: "pgn_01J...", delivery_attempts: 2 }
```

## Destinations

Destinations define where pigeons get forwarded to — URLs, Slack, Discord, or email.

```ts
// Create a URL destination
const dest = await client.createDestination("rst_01J...", {
  destination_type: "url",
  config: { url: "https://example.com/webhook" },
  filter_expression: "headers.x-event == 'push'",  // optional CEL filter
  retry_max: 3,
  retry_delay_ms: 1000,
  retry_multiplier: 2,
});

// List destinations for a roost
const destinations = await client.listDestinations("rst_01J...");

// Get by ID
const dest = await client.getDestination("dst_01J...");

// Pause / unpause
await client.pauseDestination("dst_01J...", true);   // pause
await client.pauseDestination("dst_01J...", false);  // unpause

// Delete
await client.deleteDestination("dst_01J...");
```

### Destination types

| Type | Config |
|------|--------|
| `url` | `{ url: string }` |
| `slack` | `{ webhook_url: string }` |
| `discord` | `{ webhook_url: string }` |
| `email` | `{ to: string }` |

## API Keys

Manage API keys for programmatic access.

```ts
// Create (name is optional)
const created = await client.createApiKey({ name: "CI deploy key" });
// => { id: "...", key: "pk_live_...", key_prefix: "pk_live_abc", name: "CI deploy key", created_at: "..." }
// The full key is only returned at creation time — store it securely.

// List
const keys = await client.listApiKeys();

// Get
const key = await client.getApiKey("key_01J...");

// Rename
await client.updateApiKey("key_01J...", { name: "Renamed key" });

// Revoke
await client.deleteApiKey("key_01J...");
```

## Real-time Events (SSE)

Subscribe to a live stream of incoming pigeons using Server-Sent Events. Works in any runtime with `fetch` and `ReadableStream`.

```ts
import { createEventSource } from "@pgns/core";

const controller = new AbortController();

createEventSource("https://api.pgns.io", {
  token: "eyJhbG...",
  roostId: "rst_01J...",            // optional — omit for all roosts
  signal: controller.signal,
  onEvent(data) {
    console.log("New pigeon:", data);
  },
  onError(err) {
    console.error("SSE error:", err);
  },
});

// Stop listening
controller.abort();
```

The connection automatically reconnects on failure with a 3-second delay.

## Error Handling

All API errors throw a `PigeonsError` with the HTTP status code attached.

```ts
import { PigeonsClient, PigeonsError } from "@pgns/core";

try {
  await client.getRoost("rst_nonexistent");
} catch (err) {
  if (err instanceof PigeonsError) {
    console.error(err.message); // "Not found"
    console.error(err.status);  // 404
  }
}
```

## Zod Schemas

Every type has a corresponding Zod schema exported for runtime validation. Useful for validating webhook payloads or API responses in your own code.

```ts
import { PigeonSchema, RoostSchema } from "@pgns/core";

const parsed = PigeonSchema.parse(untrustedData);
```

Available schemas: `AuthTokensSchema`, `UserSchema`, `RoostSchema`, `PigeonSchema`, `DestinationSchema`, `DeliveryAttemptSchema`, `ApiKeyResponseSchema`, `ApiKeyCreatedResponseSchema`, `CreateRoostSchema`, `UpdateRoostSchema`, `CreateDestinationSchema`, `CreateApiKeyRequestSchema`, `UpdateApiKeyRequestSchema`, `ReplayResponseSchema`, `ApiErrorSchema`, `DestinationTypeSchema`, `DeliveryStatusSchema`.

## TypeScript

All types are exported and inferred from the Zod schemas:

```ts
import type { Roost, Pigeon, Destination, DeliveryAttempt } from "@pgns/core";
```
