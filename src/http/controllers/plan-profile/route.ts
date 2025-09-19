import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CancelPlanProfileController } from './cancel-plan-profile-controller'
import { RenewPlanProfileController } from './renew-plan-profile-controller'

export async function planProfileRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.patch('/plan-profiles/:id/cancel', CancelPlanProfileController)
  app.patch('/plan-profiles/:id/renew', RenewPlanProfileController)
}
