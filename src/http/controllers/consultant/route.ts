import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'

export async function consultantRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/consultants', List)
}
