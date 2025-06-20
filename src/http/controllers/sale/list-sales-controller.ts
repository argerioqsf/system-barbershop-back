import { makeListSales } from '@/services/@factories/sale/make-list-sales'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export const ListSalesController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListSales()
  const user = request.user as UserToken
  const getProfileFromUserId = getProfileFromUserIdService()
  const { profile } = await getProfileFromUserId.execute({ id: user.sub })
  const permissions = profile.permissions.map((p) => p.name)
  const { sales } = await service.execute({ ...user, permissions })
  return reply.status(200).send(sales)
}
