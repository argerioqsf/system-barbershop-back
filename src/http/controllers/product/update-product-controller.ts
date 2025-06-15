import { makeUpdateProductService } from '@/services/@factories/product/make-update-product'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function UpdateProductController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number().optional(),
    cost: z.number().optional(),
    price: z.number().optional(),
    imageUrl: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateProductService()
  const { product } = await service.execute({ id, data })
  return reply.status(200).send(product)
}
