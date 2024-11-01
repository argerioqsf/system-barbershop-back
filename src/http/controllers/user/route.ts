import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { CreateUserProfile } from './create'
import { getUser } from './get-user'
import { ResetPasswordUser } from './reset-password'

export async function userRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/users', List)

  app.get('/user/:id', getUser)

  app.post('/create/user', CreateUserProfile)

  app.put('/resetPassword/user', ResetPasswordUser)
}
