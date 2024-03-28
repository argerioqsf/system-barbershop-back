import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { CreateUserProfile } from './create'

export async function userRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/users', List)

  app.post('/create/user', CreateUserProfile)
}
