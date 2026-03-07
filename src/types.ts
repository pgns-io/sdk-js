import { z } from 'zod';

/** Supported destination types for webhook forwarding. */
export const DestinationTypeSchema = z.enum(['url', 'slack', 'discord', 'email']);
export type DestinationType = z.infer<typeof DestinationTypeSchema>;

/** Lifecycle status of a delivery attempt. */
export const DeliveryStatusSchema = z.enum([
  'pending',
  'delivering',
  'delivered',
  'failed',
  'retrying',
  'filtered',
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

/** Token pair returned by authentication endpoints. */
export const AuthTokensSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

/** An authenticated user account. */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  plan: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

/** Known webhook source types for provider-specific signature verification. */
export const SourceTypeSchema = z.enum([
  'github',
  'stripe',
  'shopify',
  'slack',
  'discord',
  'svix',
  'pigeon',
  'linear',
  'sentry',
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

/** A roost — a webhook endpoint that captures incoming requests. */
export const RoostSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  secret: z.string().nullable(),
  source_type: SourceTypeSchema.nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Roost = z.infer<typeof RoostSchema>;

/** A captured webhook request. */
export const PigeonSchema = z.object({
  id: z.string(),
  roost_id: z.string(),
  source_ip: z.string(),
  request_method: z.string(),
  content_type: z.string(),
  headers: z.record(z.string(), z.unknown()),
  body_json: z.unknown().nullable(),
  body_raw: z.array(z.number()).nullable(),
  request_query: z.record(z.string(), z.unknown()).nullable(),
  replayed_from: z.string().nullable(),
  delivery_status: DeliveryStatusSchema,
  received_at: z.string(),
});
export type Pigeon = z.infer<typeof PigeonSchema>;

/** A forwarding target attached to a roost. */
export const DestinationSchema = z.object({
  id: z.string(),
  roost_id: z.string(),
  destination_type: DestinationTypeSchema,
  config: z.record(z.string(), z.unknown()),
  filter_expression: z.string(),
  template: z.string(),
  retry_max: z.number(),
  retry_delay_ms: z.number(),
  retry_multiplier: z.number(),
  is_paused: z.boolean(),
  is_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Destination = z.infer<typeof DestinationSchema>;

/** A single attempt to deliver a pigeon to a destination. */
export const DeliveryAttemptSchema = z.object({
  id: z.string(),
  pigeon_id: z.string(),
  destination_id: z.string(),
  status: DeliveryStatusSchema,
  attempt_number: z.number(),
  response_status: z.number().nullable(),
  response_body: z.string().nullable(),
  response_headers: z.record(z.string(), z.string()).nullable().optional(),
  error_message: z.string().nullable(),
  attempted_at: z.string(),
  next_retry_at: z.string().nullable(),
});
export type DeliveryAttempt = z.infer<typeof DeliveryAttemptSchema>;

/** An API key (without the full key value). */
export const ApiKeyResponseSchema = z.object({
  id: z.string(),
  key_prefix: z.string(),
  name: z.string(),
  last_used: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
});
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

/** Response from creating an API key — includes the full key (shown only once). */
export const ApiKeyCreatedResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  key_prefix: z.string(),
  name: z.string(),
  created_at: z.string(),
});
export type ApiKeyCreatedResponse = z.infer<typeof ApiKeyCreatedResponseSchema>;

/** Body for `POST /v1/roosts`. */
export const CreateRoostSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  secret: z.string().optional(),
  source_type: SourceTypeSchema.optional(),
});
export type CreateRoost = z.infer<typeof CreateRoostSchema>;

/** Body for `PATCH /v1/roosts/:id`. */
export const UpdateRoostSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  secret: z.string().optional(),
  source_type: SourceTypeSchema.optional(),
  is_active: z.boolean().optional(),
});
export type UpdateRoost = z.infer<typeof UpdateRoostSchema>;

/** Body for `POST /v1/roosts/:id/destinations`. */
export const CreateDestinationSchema = z.object({
  destination_type: DestinationTypeSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  filter_expression: z.string().optional(),
  template: z.string().optional(),
  retry_max: z.number().optional(),
  retry_delay_ms: z.number().optional(),
  retry_multiplier: z.number().optional(),
});
export type CreateDestination = z.infer<typeof CreateDestinationSchema>;

/** Body for `PATCH /v1/me`. */
export const UpdateProfileRequestSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

/** Body for `POST /v1/api-keys`. */
export const CreateApiKeyRequestSchema = z.object({
  name: z.string().optional(),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;

/** Body for `PATCH /v1/api-keys/:id`. */
export const UpdateApiKeyRequestSchema = z.object({
  name: z.string(),
});
export type UpdateApiKeyRequest = z.infer<typeof UpdateApiKeyRequestSchema>;

/** Response from `POST /v1/pigeons/:id/replay`. */
export const ReplayResponseSchema = z.object({
  replayed: z.boolean(),
  pigeon_id: z.string(),
  delivery_attempts: z.number(),
});
export type ReplayResponse = z.infer<typeof ReplayResponseSchema>;

/** A reusable template for formatting webhook payloads. */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Template = z.infer<typeof TemplateSchema>;

/** Body for `POST /v1/templates`. */
export const CreateTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  body: z.string().optional(),
});
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;

/** Body for `PATCH /v1/templates/:id`. */
export const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  body: z.string().optional(),
});
export type UpdateTemplate = z.infer<typeof UpdateTemplateSchema>;

/** Body for `POST /v1/templates/preview`. */
export const PreviewTemplateRequestSchema = z.object({
  body: z.string(),
  pigeon_id: z.string(),
});
export type PreviewTemplateRequest = z.infer<typeof PreviewTemplateRequestSchema>;

/** Response from `POST /v1/templates/preview`. */
export const PreviewTemplateResponseSchema = z.object({
  rendered: z.string(),
});
export type PreviewTemplateResponse = z.infer<typeof PreviewTemplateResponseSchema>;

/** Generic paginated response envelope. */
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
  });
}

export const PaginatedPigeonsSchema = PaginatedResponseSchema(PigeonSchema);
export type PaginatedPigeons = z.infer<typeof PaginatedPigeonsSchema>;

export const PaginatedDeliveryAttemptsSchema = PaginatedResponseSchema(DeliveryAttemptSchema);
export type PaginatedDeliveryAttempts = z.infer<typeof PaginatedDeliveryAttemptsSchema>;

/** Error body returned by the API on non-2xx responses. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  status: z.number(),
  code: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
