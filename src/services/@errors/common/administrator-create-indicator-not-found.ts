export class AdministratorCreateIndicatorNotFound extends Error {
  constructor() {
    super('indicator cannot create a lead for another indicator')
  }
}
