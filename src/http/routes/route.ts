import { FastifyInstance } from 'fastify'
import { users } from '../controllers/users-controller'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', users)
}
