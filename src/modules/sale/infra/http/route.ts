import { FastifyInstance } from 'fastify'

import { verifyJWT } from '@/http/middlewares/verify-jwt'

import { createSaleController } from './controllers/create-sale-controller'
import { getSaleController } from './controllers/get-sale-controller'
import { updateSaleItemQuantityController } from './controllers/update-sale-item-quantity-controller'
import { ListSalesController } from './controllers/list-sales-controller'
import { UpdateSaleController } from './controllers/update-sale-controller'
import { UpdateSaleStatusController } from './controllers/update-sale-status-controller'
import { RemoveAddSaleItemController } from './controllers/remove-add-sale-item-controller'
import { UpdateCouponSaleController } from './controllers/update-coupon-sale-controller'
import { PaySaleController } from './controllers/pay-sale-controller'
import { UpdateClientSaleController } from './controllers/update-client-sale-controller'
import { UpdateSaleItemController } from './controllers/update-sale-item-controller'
import { UpdateCouponSaleItemController } from './controllers/update-coupon-sale-item-controller'
import { UpdateSaleItemBarberController } from './controllers/update-sale-item-barber-controller'
import { UpdateSaleItemCustomPriceController } from './controllers/update-sale-item-custom-price-controller'

export async function saleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/sales', createSaleController)
  app.get('/sales', ListSalesController)
  app.get('/sales/:id', getSaleController)
  app.patch('/sales/:id', UpdateSaleController)
  app.patch('/sales/:id/status', UpdateSaleStatusController)
  app.patch('/sales/:id/saleItems', RemoveAddSaleItemController)
  app.patch('/sales/:id/coupon', UpdateCouponSaleController)
  app.patch('/sales/:id/pay', PaySaleController)
  app.patch('/sales/:id/client', UpdateClientSaleController)

  app.patch('/sales/saleItem/:id', UpdateSaleItemController)
  app.patch('/sales/saleItem/:id/coupon', UpdateCouponSaleItemController)
  app.patch('/sales/saleItem/:id/barber', UpdateSaleItemBarberController)
  app.patch('/sales/saleItem/:id/quantity', updateSaleItemQuantityController)
  app.patch(
    '/sales/saleItem/:id/custom-price',
    UpdateSaleItemCustomPriceController,
  )
}
