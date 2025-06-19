export class AffectedUserNotFoundError extends Error {
  constructor() {
    super('Affected user not found')
  }
}
