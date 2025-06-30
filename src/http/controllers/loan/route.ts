import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateLoanController } from './create-loan-controller'
import { ListUserLoansController } from './list-user-loans-controller'
import { UpdateLoanStatusController } from './update-loan-status-controller'

export async function loanRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/loans', CreateLoanController)
  app.get('/users/:userId/loans', ListUserLoansController)
  app.patch('/loans/:id/status', UpdateLoanStatusController)
}
