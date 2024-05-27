import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { Update } from './update'

export async function OrganizationRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.put('/organization/:id/update', Update)
}
