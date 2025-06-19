import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCreateProductService } from '@/services/@factories/product/make-create-product'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateProductController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.coerce.number().optional(),
    cost: z.coerce.number(),
    price: z.coerce.number(),
  })
  const data = bodySchema.parse(request.body)

  const imageUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined

  const service = makeCreateProductService()
  const unitId = (request.user as UserToken).unitId
  const { product } = await service.execute({
    name: data.name,
    description: data.description,
    quantity: data.quantity,
    cost: data.cost,
    price: data.price,
    imageUrl,
    unitId,
  })

  return reply.status(201).send(product)
})
