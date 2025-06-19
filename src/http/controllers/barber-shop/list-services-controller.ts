import { withErrorHandling } from '@/utils/http-error-handler'
import { makeListServices } from '@/services/@factories/barbershop/make-list-services'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListServicesController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const service = makeListServices()
    const userToken = request.user as UserToken
    const { services } = await service.execute(userToken)
    return reply.status(200).send(services)
  },
)
