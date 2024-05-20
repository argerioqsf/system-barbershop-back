import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { List } from './list'
import { getLead } from './get-lead'
import { Update } from './update'
import { UpdateArchived } from './update-archived'
import { ListArchived } from './list-archived'

export async function leadsRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/leads', Create)

  app.get('/leads', List)

  app.get('/lead/:id', getLead)

  app.put('/lead/:id', Update)

  app.patch('/lead/:id', UpdateArchived)

  app.get('/leads/archived', ListArchived)
}
