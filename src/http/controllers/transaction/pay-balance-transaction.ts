import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makePayBalanceTransaction } from '@/services/@factories/transaction/make-pay-balance-transaction'
import { assertPermission } from '@/utils/permissions'

export const PayBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z
    .object({
      description: z.string().optional(),
      amount: z.coerce.number().gt(0).optional(),
      saleItemIds: z
        .union([
          z.array(z.string()),
          z.string().transform((val) => JSON.parse(val) as string[]),
        ])
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
          message: 'IDs em saleItemIds devem ser únicos.',
        })
        .optional(),
      appointmentServiceIds: z
        .union([
          z.array(z.string()),
          z.string().transform((val) => JSON.parse(val) as string[]),
        ])
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
          message: 'IDs em appointmentServiceIds devem ser únicos.',
        })
        .optional(),
      affectedUserId: z.string(),
    })
    .refine(
      (d) =>
        d.amount !== undefined ||
        (d.saleItemIds?.length ?? 0) > 0 ||
        (d.appointmentServiceIds?.length ?? 0) > 0,
      {
        message: 'amount or sale items required',
      },
    )

  const user = request.user as UserToken
  const data = bodySchema.parse(request.body)

  await assertPermission(['MANAGE_OTHER_USER_TRANSACTION'], user.permissions)

  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const service = makePayBalanceTransaction()
  const { transactions } = await service.execute({
    userId: user.sub,
    affectedUserId: data.affectedUserId,
    description: data.description,
    amount: data.amount,
    saleItemIds: data.saleItemIds,
    appointmentServiceIds: data.appointmentServiceIds,
    receiptUrl,
  })
  return reply.status(201).send({ transactions })
}
