import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { MountSelect } from './mount-select'
import { UpdateActive } from './update-active'

export async function indicatorRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/indicators', List)

  app.get('/indicator/select', MountSelect)

  app.patch('/indicator/active/:id', UpdateActive)
}
