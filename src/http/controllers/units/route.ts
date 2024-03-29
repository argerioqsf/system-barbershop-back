import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'

export async function unitRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  
  app.get('/units', List)

  app.post('/create/unit', Create)
}
