import { makeCreateService } from '@/services/@factories/barbershop/make-create-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function CreateServiceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    cost: z.coerce.number(),
    price: z.coerce.number(),
    isProduct: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
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
}
