export class RolesNotFoundError extends Error {
  constructor() {
    super('Role not found')
  }
}
