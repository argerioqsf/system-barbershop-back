import { FastifyInstance } from 'fastify'
import { authenticate } from '../controllers/authenticate-controller'
import { registerUser } from '../controllers/register-user-controller'
import { RegisterIndicatorController } from '../controllers/register-indicator-controller'
import { RegisterLeadPublicController } from '../controllers/register-lead-public-controller'
import { GetIndicatorProfile } from '../controllers/indicator/get-indicator'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  app.get('/indicator/:id', GetIndicatorProfile)
  app.post('/create/indicator', RegisterIndicatorController)
  app.post('/create/lead', RegisterLeadPublicController)
}
