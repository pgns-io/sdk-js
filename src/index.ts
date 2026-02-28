export { PigeonsClient } from './client.js';
export type { PigeonsClientConfig } from './client.js';
export { PigeonsError } from './errors.js';
export { createEventSource } from './events.js';
export type { EventSourceOptions } from './events.js';

// -- Schemas (Zod) --
export {
  ApiErrorSchema,
  ApiKeyCreatedResponseSchema,
  ApiKeyResponseSchema,
  AuthTokensSchema,
  CreateApiKeyRequestSchema,
  CreateDestinationSchema,
  CreateRoostSchema,
  DeliveryAttemptSchema,
  DeliveryStatusSchema,
  DestinationSchema,
  DestinationTypeSchema,
  LoginRequestSchema,
  MagicLinkRequestSchema,
  MagicLinkVerifyRequestSchema,
  PaginatedDeliveryAttemptsSchema,
  PaginatedPigeonsSchema,
  PaginatedResponseSchema,
  PigeonSchema,
  ReplayResponseSchema,
  RoostSchema,
  SignupRequestSchema,
  UpdateApiKeyRequestSchema,
  UpdateRoostSchema,
} from './types.js';

// -- Types (inferred from schemas) --
export type {
  ApiError,
  ApiKeyCreatedResponse,
  ApiKeyResponse,
  AuthTokens,
  CreateApiKeyRequest,
  CreateDestination,
  CreateRoost,
  DeliveryAttempt,
  DeliveryStatus,
  Destination,
  DestinationType,
  LoginRequest,
  MagicLinkRequest,
  MagicLinkVerifyRequest,
  PaginatedDeliveryAttempts,
  PaginatedPigeons,
  Pigeon,
  ReplayResponse,
  Roost,
  SignupRequest,
  UpdateApiKeyRequest,
  UpdateRoost,
} from './types.js';
