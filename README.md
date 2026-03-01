# pgns JavaScript SDK

TypeScript client library for the [pgns](https://pgns.io) webhook relay API.

## Installation

```bash
npm install @pgns/sdk
```

## Quick Start

```ts
import { PigeonsClient } from '@pgns/sdk';

const client = new PigeonsClient({
  baseUrl: 'https://api.pgns.io',
  apiKey: 'pk_live_...',
});

// List roosts
const roosts = await client.listRoosts();

// List pigeons for a roost
const pigeons = await client.listPigeons({ roostId: 'rst_abc123' });
```

## Documentation

Full documentation is available at [docs.pgns.io/sdks/javascript](https://docs.pgns.io/sdks/javascript).

## License

MIT
