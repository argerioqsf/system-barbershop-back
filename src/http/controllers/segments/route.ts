import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { Create } from './create'
import { MountSelect } from './mount-select'
import { getSegment } from './get-segment'
import { deleteSegment } from './delete'
import { Update } from './update'
import { deleteCourseSegment } from './delete-course-segment'

export async function segmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/segments', List)

  app.get('/segment/:id', getSegment)

  app.delete('/segment/:id', deleteSegment)

  app.delete('/segment/:segmentId/course/:courseId/delete', deleteCourseSegment)

  app.post('/create/segment', Create)

  app.put('/segment/:id/update', Update)

  app.get('/segment/select', MountSelect)
}
