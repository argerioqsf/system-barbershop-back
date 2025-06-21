export class InvalidPermissionError extends Error {
  constructor() {
    super('permission not allowed for role')
  }
}
