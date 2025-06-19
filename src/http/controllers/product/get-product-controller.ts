import { makeGetProductService } from '@/services/@factories/product/make-get-product'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetProductController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetProductService()
  const { product } = await service.execute({ id })
  if (!product) return reply.status(404).send({ message: 'Product not found' })
  return reply.status(200).send(product)
}
