import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateSaleItem } from '@/services/@factories/sale/update-sale-item'

export const UpdateSaleItemController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    serviceId: z.string().optional().nullable(),
    productId: z.string().optional().nullable(),
    appointmentId: z.string().optional().nullable(),
    planId: z.string().optional().nullable(),
    quantity: z.number().optional(),
    barberId: z.string().optional().nullable(),
    couponId: z.string().optional().nullable(),
    couponCode: z.string().optional().nullable(),
    // TODO: analisar logica de quando eu tenho uma quantidade maior
    // que 1 e adiciono um customPrice o valor total do saleItem vira
    // o customPrice ele nao esta levando em consideracao a quantidade de itens
    // o certo é pegar o valor do customPrice e multiplicar pela quantidade
    customPrice: z.number().optional().nullable(),
  })
  const { id } = paramsSchema.parse(request.params)
  const {
    serviceId,
    productId,
    appointmentId,
    planId,
    quantity,
    barberId,
    couponId,
    couponCode,
    customPrice,
  } = bodySchema.parse(request.body)
  const service = makeUpdateSaleItem()
  const { sale, saleItems } = await service.execute({
    id,
    saleItemUpdateFields: {
      serviceId,
      productId,
      appointmentId,
      planId,
      quantity,
      barberId,
      couponId,
      couponCode,
      customPrice,
    },
  })
  return reply.status(200).send({ sale, saleItems })
}
