import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { Create } from './create'
import { MountSelect } from './mount-select'
import { getSegment } from './get-segment'

export async function segmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/segments', List)

  app.get('/segment/:id', getSegment)

  app.post('/create/segment', Create)

  app.get('/segment/select', MountSelect)
}
