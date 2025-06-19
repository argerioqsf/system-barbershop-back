import { withErrorHandling } from '@/utils/http-error-handler'
import { makeListProductsService } from '@/services/@factories/product/make-list-products'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListProductsController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const service = makeListProductsService()
    const userToken = request.user as UserToken
    const { products } = await service.execute(userToken)
    return reply.status(200).send(products)
  },
)
