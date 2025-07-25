import { makeUpdateCategoryService } from '@/services/@factories/category/make-update-category'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateCategoryController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({ name: z.string().optional() })

  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)

  const service = makeUpdateCategoryService()
  const { category } = await service.execute({ id, data })
  return reply.status(200).send(category)
}
