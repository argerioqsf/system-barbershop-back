import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { List } from './list'
import { MountSelect } from './mount-select'
import { GetConsultantProfile } from './get-consultant'

export async function consultantRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/consultants', List)

  app.get('/consultant/select', MountSelect)

  app.get('/consultant/:id', GetConsultantProfile)
}
