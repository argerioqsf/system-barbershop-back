import { FastifyInstance } from 'fastify'
import { authenticate } from '../controllers/authenticate-controller'
import { registerUser } from '../controllers/register-user-controller'
import { CreateUnitCourseController } from '../controllers/unit-course/create-unit-course-controller'
import { verifyJWT } from '../middlewares/verify-jwt'

export async function appRoute(app: FastifyInstance) {
  app.post('/users', registerUser)
  app.post('/sessions', authenticate)
  
  // authenticated
  app.post('/create/unit/courses', {onRequest: [verifyJWT]}, CreateUnitCourseController)
}
