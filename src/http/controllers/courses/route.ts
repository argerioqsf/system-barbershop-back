import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'
import { getCourse } from './get-course'
import { deleteCourse } from './delete'
import { Update } from './update'

export async function courseRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/courses', List)

  app.get('/course/:id', getCourse)

  app.delete('/course/delete/:id', deleteCourse)

  app.post('/create/course', Create)

  app.put('/course/:id/update', Update)
}
