export class SessionNotFoundError extends Error {
  constructor() {
    super('Session not found')
  }
}
