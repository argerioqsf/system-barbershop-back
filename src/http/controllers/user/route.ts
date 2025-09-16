import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { ListClientsController } from './list-clients-controller'

export async function userRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/clients', ListClientsController)
}
