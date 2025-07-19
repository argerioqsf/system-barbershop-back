import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateDebtController } from './create-debt-controller'
import { ListDebtsController } from './list-debts-controller'
import { GetDebtController } from './get-debt-controller'
import { UpdateDebtController } from './update-debt-controller'
import { DeleteDebtController } from './delete-debt-controller'

export async function debtRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/debts', CreateDebtController)
  app.get('/debts', ListDebtsController)
  app.get('/debts/:id', GetDebtController)
  app.patch('/debts/:id', UpdateDebtController)
  app.delete('/debts/:id', DeleteDebtController)
}
