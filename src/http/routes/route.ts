import { FastifyInstance } from 'fastify'
import { users } from '../controllers/users-controller'
import { authenticate } from '../controllers/authenticate-controller'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', users)
  app.post('/sessions', authenticate)
}
