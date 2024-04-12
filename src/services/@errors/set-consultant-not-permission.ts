export class SetConsultantNotPermitError extends Error {
  constructor() {
    super('You are not allowed to add consultant')
  }
}
