import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { Create } from './create'
import { Search } from './search'

export async function segmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/segments', List)

  app.get('/segment', Search)

  app.post('/create/segment', Create)
}
