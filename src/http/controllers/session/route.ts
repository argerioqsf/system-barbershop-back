import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { SetUserUnitController } from '../set-user-unit-controller'

export async function sessionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.patch('/sessions/unit', SetUserUnitController)
}
