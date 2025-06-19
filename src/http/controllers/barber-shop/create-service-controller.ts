import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCreateService } from '@/services/@factories/barbershop/make-create-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateServiceController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    cost: z.coerce.number(),
    price: z.coerce.number(),
  })

  const data = bodySchema.parse(request.body)

  const imageUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined

  const serviceCreator = makeCreateService()
  const unitId = (request.user as UserToken).unitId
  const { service } = await serviceCreator.execute({
    ...data,
    imageUrl,
    unitId,
  })

  return reply.status(201).send(service)
})
