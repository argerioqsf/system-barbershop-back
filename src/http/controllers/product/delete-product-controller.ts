import { makeDeleteProductService } from '@/services/@factories/product/make-delete-product'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function DeleteProductController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteProductService()
  await service.execute({ id })
  return reply.status(204).send()
}
