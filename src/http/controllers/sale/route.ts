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
import { UpdateSaleItemController } from './update-sale-item-controler'
import { UpdateCouponSaleItemController } from './update-coupon-sale-item-controler'
import { UpdateSaleItemBarberController } from './update-sale-item-barber-controller'
import { UpdateSaleItemQuantityController } from './update-sale-item-quantity-controller'
import { UpdateSaleItemCustomPriceController } from './update-sale-item-custom-price-controller'
import { UpdateSaleStatusController } from './update-sale-status-controller'

export async function saleRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/sales', CreateSaleController)
  app.get('/sales', ListSalesController)
  app.get('/sales/:id', GetSaleController)
  app.patch('/sales/:id', UpdateSaleController)
  app.patch('/sales/:id/status', UpdateSaleStatusController)
  app.patch('/sales/:id/saleItems', RemoveAddSaleItemController)
  app.patch('/sales/:id/coupon', UpdateCouponSaleController)
  app.patch('/sales/:id/pay', PaySaleController)
  app.patch('/sales/:id/client', UpdateClientSaleController)
  // Sale Item
  app.patch('/sales/saleItem/:id', UpdateSaleItemController)
  app.patch('/sales/saleItem/:id/coupon', UpdateCouponSaleItemController)
  app.patch('/sales/saleItem/:id/barber', UpdateSaleItemBarberController)
  app.patch('/sales/saleItem/:id/quantity', UpdateSaleItemQuantityController)
  app.patch(
    '/sales/saleItem/:id/custom-price',
    UpdateSaleItemCustomPriceController,
  )
}
