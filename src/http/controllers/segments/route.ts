import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { Create } from './create'

export async function segmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/segments', List)

  app.post('/create/segment', Create)
}
