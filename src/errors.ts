/** Error thrown by {@link PigeonsClient} when the API returns a non-2xx response. */
export class PigeonsError extends Error {
  /** HTTP status code from the API response. */
  status: number;

  constructor(message: string, status: number, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'PigeonsError';
    this.status = status;
  }
}
