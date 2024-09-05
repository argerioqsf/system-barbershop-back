export class LeadIsAlreadyEnrolled extends Error {
  constructor() {
    super('lead is already enrolled')
  }
}
