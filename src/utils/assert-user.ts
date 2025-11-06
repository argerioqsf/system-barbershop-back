import { UserToken } from '@/http/controllers/authenticate-controller'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'

export function assertUser(user: UserToken): void {
  if (!user.sub) throw new UserNotFoundError()
}
