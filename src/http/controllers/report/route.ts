import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { GetSalesReportController } from './get-sales-report-controller'
import { GetBarberBalanceController } from './get-barber-balance-controller'
import { GetOwnerBalanceController } from './get-owner-balance-controller'
import { GetCashSessionReportController } from './get-cash-session-report-controller'
import { GetUnitLoanBalanceController } from './get-unit-loan-balance-controller'
import { GetUserProductsController } from './get-user-products-controller'

export async function reportRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/reports/sales', GetSalesReportController)
  app.get('/reports/barber/:barberId/balance', GetBarberBalanceController)
  app.get('/reports/owner/:ownerId/balance', GetOwnerBalanceController)
  app.get('/reports/cash-session/:sessionId', GetCashSessionReportController)
  app.get('/reports/unit/:unitId/loan-balance', GetUnitLoanBalanceController)
  app.get('/reports/user/:userId/products', GetUserProductsController)
}
