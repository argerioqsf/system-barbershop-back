import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateBenefitController } from './create-benefit-controller'
import { ListBenefitsController } from './list-benefits-controller'
import { GetBenefitController } from './get-benefit-controller'
import { UpdateBenefitController } from './update-benefit-controller'
import { DeleteBenefitController } from './delete-benefit-controller'

export async function benefitRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/benefits', CreateBenefitController)
  app.get('/benefits', ListBenefitsController)
  app.get('/benefits/:id', GetBenefitController)
  app.patch('/benefits/:id', UpdateBenefitController)
  app.delete('/benefits/:id', DeleteBenefitController)
}
