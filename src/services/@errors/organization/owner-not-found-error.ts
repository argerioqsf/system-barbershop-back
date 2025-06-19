export class OwnerNotFoundError extends Error {
  constructor() {
    super('Owner not found')
  }
}
