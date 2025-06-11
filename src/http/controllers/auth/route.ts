import { FastifyInstance } from 'fastify'
import { registerUser } from '../register-user-controller'
import { authenticate } from '../authenticate-controller'
import { SendResetLinkController } from '../password/send-reset-link-controller'
import { ResetWithTokenController } from '../password/reset-with-token-controller'
import { SelectUnitController } from './select-unit-controller'
import { verifyJWT } from '@/http/middlewares/verify-jwt'

export async function authRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  app.post('/sessions/unit', { preHandler: verifyJWT }, SelectUnitController)
  app.post('/forgot-password', SendResetLinkController)
  app.post('/reset-password', ResetWithTokenController)
}
