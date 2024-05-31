import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'
import { getLead } from './get-lead'
import { Update } from './update'
import { UpdateArchived } from './update-archived'
import { UpdateStatus } from './update-status'
import { UpdateAddConsultant } from './update-add-consultant'

export async function leadsRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/leads', Create)

  app.get('/leads', List)

  app.get('/lead/:id', getLead)

  app.put('/lead/:id', Update)

  app.patch('/lead/archived/:id', UpdateArchived)

  app.patch('/lead/status/:id', UpdateStatus)

  app.patch('/lead/consultant/:id', UpdateAddConsultant)
}
