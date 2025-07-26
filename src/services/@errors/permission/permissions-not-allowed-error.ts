import { InvalidPermissionError } from './invalid-permission-error'

export class PermissionsNotAllowedError extends InvalidPermissionError {
  constructor() {
    super()
    this.name = 'PermissionsNotAllowedError'
  }
}
