import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateSaleController } from './create-sale-controller'
import { ListSalesController } from './list-sales-controller'
import { GetSaleController } from './get-sale-controller'
import { PaySaleController } from './pay-sale-controller'
import { UpdateSaleController } from './update-sale-controller'
import { RemoveAddSaleItemController } from './remove-add-sale-item-controler'
import { UpdateCouponSaleController } from './update-coupon-sale-controller'
import { UpdateClientSaleController } from './update-client-sale-controller'

export async function saleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/sales', CreateSaleController)
  app.get('/sales', ListSalesController)
  app.get('/sales/:id', GetSaleController)
  app.patch('/sales/:id', UpdateSaleController)
  app.patch('/sales/:id/saleItems', RemoveAddSaleItemController)
  app.patch('/sales/:id/coupon', UpdateCouponSaleController)
  app.patch('/sales/:id/pay', PaySaleController)
  app.patch('/sales/:id/client', UpdateClientSaleController)
}
