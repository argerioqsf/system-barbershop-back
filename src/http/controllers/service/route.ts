import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { GetServiceController } from './get-service-controller'
import { UpdateServiceController } from './update-service-controller'

export async function serviceRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/services/:id', GetServiceController)
  app.patch('/services/:id', UpdateServiceController)
}
