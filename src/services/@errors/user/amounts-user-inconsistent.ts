export class AmountsUserInconsistentError extends Error {
  constructor() {
    super('Amounts receivable from the user are inconsistent')
  }
}
