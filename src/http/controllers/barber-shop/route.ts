import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { upload } from '@/lib/upload'
import { CreateServiceController } from './create-service-controller'
import { ListServicesController } from './list-services-controller'

export async function barberShopServiceRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post(
    '/create/service',
    { preHandler: upload.single('image') },
    CreateServiceController,
  )
  app.get(
    '/services',
    { preHandler: verifyPermission('LIST_SERVICES') },
    ListServicesController,
  )
}
