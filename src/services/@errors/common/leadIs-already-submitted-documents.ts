export class LeadIsAlreadySubmittedDocuments extends Error {
  constructor() {
    super('lead has already submitted the documents')
  }
}
