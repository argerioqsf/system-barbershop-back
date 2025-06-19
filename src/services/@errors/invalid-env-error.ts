export class InvalidEnvError extends Error {
  constructor() {
    super('Invalid environment variables')
  }
}
