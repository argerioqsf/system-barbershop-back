import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'

export async function courseRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/courses', List)

  app.post('/create/course', Create)
}
