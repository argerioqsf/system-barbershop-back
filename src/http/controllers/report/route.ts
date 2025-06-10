import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { GetSalesReportController } from './get-sales-report-controller'

export async function reportRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/reports/sales', GetSalesReportController)
}
