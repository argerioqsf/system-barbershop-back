import { FastifyInstance } from 'fastify'
import { registerUser } from '../register-user-controller'
import { authenticate } from '../authenticate-controller'

export async function authRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
}
