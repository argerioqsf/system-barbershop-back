export class UserTypeNotCompatible extends Error {
  constructor() {
    super('user type not compatible with unit linking')
  }
}
