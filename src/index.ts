export { PigeonsClient } from './client.js';
export type { PigeonsClientConfig } from './client.js';
export { PigeonsError, WebhookVerificationError } from './errors.js';
export type { WebhookVerificationCode } from './errors.js';
export { Webhook } from './webhook.js';
export type { WebhookOptions } from './webhook.js';
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
  CreateTemplateSchema,
  DeliveryAttemptSchema,
  DeliveryStatusSchema,
  DestinationSchema,
  DestinationTypeSchema,
  PaginatedDeliveryAttemptsSchema,
  PaginatedPigeonsSchema,
  PaginatedResponseSchema,
  PigeonSchema,
  PreviewTemplateRequestSchema,
  PreviewTemplateResponseSchema,
  ReplayResponseSchema,
  RoostSchema,
  TemplateSchema,
  UpdateApiKeyRequestSchema,
  UpdateProfileRequestSchema,
  UpdateRoostSchema,
  UpdateTemplateSchema,
  UserSchema,
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
  CreateTemplate,
  DeliveryAttempt,
  DeliveryStatus,
  Destination,
  DestinationType,
  PaginatedDeliveryAttempts,
  PaginatedPigeons,
  Pigeon,
  PreviewTemplateRequest,
  PreviewTemplateResponse,
  ReplayResponse,
  Roost,
  Template,
  UpdateApiKeyRequest,
  UpdateProfileRequest,
  UpdateRoost,
  UpdateTemplate,
  User,
} from './types.js';
