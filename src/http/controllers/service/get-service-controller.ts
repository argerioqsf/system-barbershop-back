import { makeGetService } from '@/services/@factories/service/make-get-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetServiceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetService()
  const { service: serviceResponse } = await service.execute({ id })
  if (!serviceResponse)
    return reply.status(404).send({ message: 'Service not found' })
  return reply.status(200).send(serviceResponse)
}
