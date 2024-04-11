import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './List'
import { GetIndicatorProfile } from './get-indicator'

export async function indicatorRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/indicators', List)

  app.get('/indicator/:id', GetIndicatorProfile)
}
