import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateCategoryController } from './create-category-controller'
import { UpdateCategoryController } from './update-category-controller'
import { ListCategoriesController } from './list-categories-controller'

export async function categoryRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/categories', CreateCategoryController)
  app.get('/categories', ListCategoriesController)
  app.patch('/categories/:id', UpdateCategoryController)
}
