import { FastifyInstance } from 'fastify'

// Import route files from the moved controllers
import { cashRegisterRoute } from './controllers/cash-register/route'
import { debtRoute } from './controllers/debt/route'
import { loanRoute } from './controllers/loan/route'
import { transactionRoute } from './controllers/transaction/route'

export async function financeRoutes(app: FastifyInstance) {
  app.register(cashRegisterRoute)
  app.register(debtRoute)
  app.register(loanRoute)
  app.register(transactionRoute)
}
