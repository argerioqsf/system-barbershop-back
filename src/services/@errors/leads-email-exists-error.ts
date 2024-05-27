export class LeadsEmailExistsError extends Error {
  constructor() {
    super('Email already registered')
  }
}
