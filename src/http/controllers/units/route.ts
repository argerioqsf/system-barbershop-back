import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'
import { getUnit } from './get-unit'
import { deleteUnit } from './delete'
import { deleteUnitCourse } from './delete-unit-course'
import { deleteUnitSegment } from './delete-unit-segment'
import { Update } from './update'

export async function unitRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/units', List)

  app.get('/unit/:id', getUnit)

  app.delete('/unit/:id', deleteUnit)

  app.delete('/unit/:unitId/course/:courseId/delete', deleteUnitCourse)

  app.delete('/unit/:unitId/segment/:segmentId/delete', deleteUnitSegment)

  app.put('/unit/:id/update', Update)

  app.post('/create/unit', Create)
}
