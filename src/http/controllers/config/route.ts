import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { ExportUsersController } from './export-users-controller'

export async function configRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/config/export/users', ExportUsersController)
}
