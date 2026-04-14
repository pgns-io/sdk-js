# pgns JavaScript SDK

TypeScript client library for the [pgns](https://pgns.io) webhook relay API.

## Installation

```bash
npm install @pgns/sdk
```

## Quick Start

```ts
import { PigeonsClient } from '@pgns/sdk/client';

const client = new PigeonsClient({
  baseUrl: 'https://api.pgns.io',
  apiKey: 'pk_live_...',
});

// List roosts
const roosts = await client.listRoosts();

// List pigeons for a roost
const pigeons = await client.listPigeons({ roostId: 'rst_abc123' });
```

## Subpath Imports

The SDK provides targeted entry points for better tree-shaking and discoverability:

```ts
import { PigeonsClient } from '@pgns/sdk/client';
import { Webhook } from '@pgns/sdk/webhook';
import { Roost, Destination, RoostSchema } from '@pgns/sdk/models';
import { PigeonsError, WebhookVerificationError } from '@pgns/sdk/errors';
import { createEventSource } from '@pgns/sdk/events';
```

The root import (`@pgns/sdk`) re-exports everything and remains available for backward compatibility.

## Documentation

Full documentation is available at [docs.pgns.io/sdks/javascript](https://docs.pgns.io/sdks/javascript).

## License

MIT
