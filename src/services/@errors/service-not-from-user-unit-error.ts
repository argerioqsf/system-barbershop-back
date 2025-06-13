export class ServiceNotFromUserUnitError extends Error {
  constructor() {
    super('Service does not belong to your unit')
  }
}
