export class LeadsDocumentExistsError extends Error {
  constructor() {
    super('Document already registered')
  }
}
