import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Create } from './create'
import { Update } from './update'

export async function cycleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/cycle', Create)

  app.patch('/update/cycle/:id/end_cycle', Update)
}
