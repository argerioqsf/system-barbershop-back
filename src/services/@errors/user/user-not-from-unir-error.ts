export class UserNotFromUnitError extends Error {
  constructor() {
    super('You do not belong to this unit')
  }
}
