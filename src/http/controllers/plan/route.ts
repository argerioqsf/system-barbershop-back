import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreatePlanController } from './create-plan-controller'
import { ListPlansController } from './list-plans-controller'
import { GetPlanController } from './get-plan-controller'
import { UpdatePlanController } from './update-plan-controller'
import { DeletePlanController } from './delete-plan-controller'

export async function planRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/plans', CreatePlanController)
  app.get('/plans', ListPlansController)
  app.get('/plans/:id', GetPlanController)
  app.patch('/plans/:id', UpdatePlanController)
  app.delete('/plans/:id', DeletePlanController)
}
