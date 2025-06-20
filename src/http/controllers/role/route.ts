import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateRoleController } from './create-role-controller'
import { ListRoleController } from './list-role-controller'
import { UpdateRoleController } from './update-role-controller'

export async function roleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/roles', CreateRoleController)
  app.get('/roles', ListRoleController)
  app.put('/roles/:id', UpdateRoleController)
}
