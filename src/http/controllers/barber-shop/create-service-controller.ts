import { makeCreateService } from '@/services/@factories/barbershop/make-create-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateServiceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    cost: z.number(),
    price: z.number(),
    isProduct: z.boolean().optional(),
  })

  const data = bodySchema.parse(request.body)

  const serviceCreator = makeCreateService()
  const { service } = await serviceCreator.execute(data)

  return reply.status(201).send(service)
}
