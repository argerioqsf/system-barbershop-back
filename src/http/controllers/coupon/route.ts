import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { CreateCouponController } from './create-coupon-controller'
import { ListCouponsController } from './list-coupons-controller'
import { GetCouponController } from './get-coupon-controller'
import { DeleteCouponController } from './delete-coupon-controller'
import { UpdateCouponController } from './update-coupon-controller'

export async function couponRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/coupons', CreateCouponController)
  app.get(
    '/coupons',
    { preHandler: verifyPermission('LIST_COUPONS') },
    ListCouponsController,
  )
  app.get('/coupons/:id', GetCouponController)
  app.patch('/coupons/:id', UpdateCouponController)
  app.delete('/coupons/:id', DeleteCouponController)
}
