import { FastifyInstance } from 'fastify'
import { registerUser } from '../register-user-controller'
import { authenticate } from '../authenticate-controller'
import { refreshTokenController } from '../refresh-token-controller'
import { SendResetLinkController } from '../password/send-reset-link-controller'
import { ResetWithTokenController } from '../password/reset-with-token-controller'

export async function authRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  app.post('/sessions/refresh', refreshTokenController)
  app.post('/forgot-password', SendResetLinkController)
  app.post('/reset-password', ResetWithTokenController)
}
