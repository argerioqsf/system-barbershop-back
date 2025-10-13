import { makeCreateProductService } from '@/services/@factories/product/make-create-product'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { logger } from '@/lib/logger'

export const CreateProductController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.coerce.number().optional(),
    cost: z.coerce.number(),
    price: z.coerce.number(),
    commissionPercentage: z.number().optional(),
    categoryId: z.string(),
  })
  const parsed = bodySchema.safeParse(request.body)

  if (!parsed.success) {
    logger.debug('errors createProduct', { errors: parsed.error })
  }

  const imageUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined

  logger.debug('imageUrl', { imageUrl })

  const data = bodySchema.parse(request.body)

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
    categoryId: data.categoryId,
  })

  return reply.status(201).send(product)
}
