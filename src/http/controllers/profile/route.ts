import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'

export async function profileRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/profile', List)  

  app.post('/create/profile', Create)
}
