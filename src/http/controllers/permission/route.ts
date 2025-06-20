import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreatePermissionController } from './create-permission-controller'
import { ListPermissionController } from './list-permission-controller'

export async function permissionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/permissions', CreatePermissionController)
  app.get('/permissions', ListPermissionController)
}
