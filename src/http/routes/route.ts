import { FastifyInstance } from 'fastify'
import { authenticate } from '../controllers/authenticate-controller'
import { registerUser } from '../controllers/register-user-controller'
import { RegisterIndicatorController } from '../controllers/register-indicator-controller'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  app.post('/create/indicator', RegisterIndicatorController)
}
