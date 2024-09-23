export class LeadNotReadyYetError extends Error {
  constructor() {
    super('lead is not ready yet')
  }
}
