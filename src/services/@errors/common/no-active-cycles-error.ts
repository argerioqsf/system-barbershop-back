export class NoActiveCyclesError extends Error {
  constructor() {
    super('There are no active cycles at the moment')
  }
}
