export class LeadAlreadyHasConsultant extends Error {
  constructor() {
    super('lead already has a consultant')
  }
}
