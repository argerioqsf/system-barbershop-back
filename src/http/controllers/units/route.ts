import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'
import { getUnit } from './get-unit'
import { Search } from './search'

export async function unitRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/units', List)

  app.get('/unit', Search)

  app.get('/unit/:id', getUnit)

  app.post('/create/unit', Create)
}
