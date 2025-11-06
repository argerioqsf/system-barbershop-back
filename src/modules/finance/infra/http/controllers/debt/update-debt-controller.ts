import { makeUpdateDebtUseCase } from '@/modules/finance/infra/factories/make-update-debt'
import { DebtPresenter } from '@/modules/finance/infra/presenters/debt-presenter'
import { Money } from '@/core/domain/value-objects/money'
import { DebtStatus } from '@/modules/finance/domain/types/status'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentStatus } from '@prisma/client'

export const UpdateDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    value: z.number().optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    paymentDate: z.coerce.date().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const useCase = makeUpdateDebtUseCase()
  const debt = await useCase.execute({
    id,
    value: data.value !== undefined ? Money.from(data.value) : undefined,
    status: data.status as DebtStatus | undefined,
    paymentDate: data.paymentDate,
  })
  return reply.status(200).send(DebtPresenter.toHTTP(debt))
}
