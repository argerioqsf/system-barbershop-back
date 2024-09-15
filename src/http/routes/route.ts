import { FastifyInstance } from 'fastify'
import { authenticate } from '../controllers/authenticate-controller'
import { registerUser } from '../controllers/register-user-controller'
import { RegisterIndicatorController } from '../controllers/register-indicator-controller'
import { RegisterLeadPublicController } from '../controllers/register-lead-public-controller'
import { GetIndicatorProfile } from '../controllers/indicator/get-indicator'
import { MountSelectSegment } from '../controllers/segments/mount-select'
import { MountSelectUnit } from '../controllers/units/mount-select'
import { MountSelectCourse } from '../controllers/courses/mount-select'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  app.get('/indicator/:id', GetIndicatorProfile)
  app.post('/create/indicator', RegisterIndicatorController)
  app.post('/create/lead', RegisterLeadPublicController)

  app.get('/segment/select', MountSelectSegment)
  app.get('/units/select', MountSelectUnit)
  app.get('/course/select', MountSelectCourse)
}
