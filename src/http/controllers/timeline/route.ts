import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'

export async function timelineRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/timeline/:leadId', Create)
}
