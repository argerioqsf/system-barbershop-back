import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { ListPendingCommissionSaleItemsUseCase } from '@/services/use-cases/collaborator/list-pending-commission-sale-items-use-case'

export async function listPendingCommissionSaleItemsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const listPendingCommissionSaleItemsParamsSchema = z.object({
    userId: z.string(),
  })

  const { userId } = listPendingCommissionSaleItemsParamsSchema.parse(
    request.params,
  )

  const saleItemRepository = new PrismaSaleItemRepository()
  const listPendingCommissionSaleItemsUseCase =
    new ListPendingCommissionSaleItemsUseCase(saleItemRepository)

  const saleItems = await listPendingCommissionSaleItemsUseCase.execute(userId)

  return reply.status(200).send(saleItems)
}
