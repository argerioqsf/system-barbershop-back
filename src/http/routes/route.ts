import { FastifyInstance } from 'fastify'
import { register } from '../controllers/register-controller'
import { authenticate } from '../controllers/authenticate-controller'
import { profile } from '../controllers/profile-controller'
import { verifyJWT } from '../middlewares/verify-jwt'
import { createProfileController } from '../controllers/profile/create-profile-controller'
import { CreateCoursesController } from '../controllers/courses/create-courses-controller'
import { GetCoursesController } from '../controllers/courses/get-courses-controller'
import { CreateSegmentsController } from '../controllers/segments/create-segments-controller'
import { GetSegmentsController } from '../controllers/segments/get-segments-controller'
import { CreateUnitController } from '../controllers/unit/create-unit-controller'
import { GetUnitController } from '../controllers/unit/get-units-controller'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', register)
  app.post('/sessions', authenticate)

  // authenticated
  app.get('/me/:id', { onRequest: [verifyJWT] }, profile)
  app.post(
    '/create/profile',
    { onRequest: [verifyJWT] },
    createProfileController,
  )
  app.post(
    '/create/course',
    { onRequest: [verifyJWT] },
    CreateCoursesController,
  )
  app.get('/courses', { onRequest: [verifyJWT] }, GetCoursesController)

  app.post(
    '/create/segments',
    { onRequest: [verifyJWT] },
    CreateSegmentsController,
  )
  app.get('/segments', { onRequest: [verifyJWT] }, GetSegmentsController)

  app.post('/create/unit', { onRequest: [verifyJWT] }, CreateUnitController)
  app.get('/units', { onRequest: [verifyJWT] }, GetUnitController)
}
