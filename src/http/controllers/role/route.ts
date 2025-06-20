import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateRoleController } from './create-role-controller'
import { ListRoleController } from './list-role-controller'

export async function roleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/roles', CreateRoleController)
  app.get('/roles', ListRoleController)
}
