import { makeCreateCategoryService } from '@/services/@factories/category/make-create-category'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateCategoryController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({ name: z.string() })
  const { name } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreateCategoryService()
  const { category } = await service.execute({ name, unitId })
  return reply.status(201).send(category)
}
