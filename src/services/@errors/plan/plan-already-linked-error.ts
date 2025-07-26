export class PlanAlreadyLinkedError extends Error {
  constructor() {
    super('Client already linked to this plan')
  }
}
