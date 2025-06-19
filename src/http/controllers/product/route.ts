import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { upload } from '@/lib/upload'
import { CreateProductController } from './create-product-controller'
import { ListProductsController } from './list-products-controller'
import { GetProductController } from './get-product-controller'
import { UpdateProductController } from './update-product-controller'
import { DeleteProductController } from './delete-product-controller'

export async function productRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post(
    '/products',
    { preHandler: upload.single('image') },
    CreateProductController,
  )
  app.get(
    '/products',
    { preHandler: verifyPermission('LIST_PRODUCTS') },
    ListProductsController,
  )
  app.get('/products/:id', GetProductController)
  app.patch('/products/:id', UpdateProductController)
  app.delete('/products/:id', DeleteProductController)
}
