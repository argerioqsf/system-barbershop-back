export class UnauthorizedAccessError extends Error {
  constructor() {
    super('Unauthorized access.')
  }
}
