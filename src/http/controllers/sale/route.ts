import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateSaleController } from './create-sale-controller'
import { ListSalesController } from './list-sales-controller'
import { GetSaleController } from './get-sale-controller'

export async function saleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/sales', CreateSaleController)
  app.get('/sales', ListSalesController)
  app.get('/sales/:id', GetSaleController)
}
