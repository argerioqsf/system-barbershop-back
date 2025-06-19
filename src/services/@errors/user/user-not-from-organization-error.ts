export class UserNotFromOrganizationError extends Error {
  constructor() {
    super('You do not belong to this organization')
  }
}
