import { makeListCategoriesService } from '@/services/@factories/category/make-list-categories'
import { FastifyRequest, FastifyReply } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListCategoriesController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListCategoriesService()
  const user = request.user as UserToken
  const { categories } = await service.execute(user)
  return reply.status(200).send(categories)
}
