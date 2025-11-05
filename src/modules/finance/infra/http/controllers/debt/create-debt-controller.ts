import { makeCreateDebtUseCase } from '@/modules/finance/infra/factories/make-create-debt'
import { DebtPresenter } from '@/modules/finance/infra/presenters/debt-presenter'
import { Money } from '@/core/domain/value-objects/money'
import { DebtStatus } from '@/modules/finance/domain/types/status'
import { PaymentStatus } from '@prisma/client'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const CreateDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    value: z.number(),
    planId: z.string(),
    planProfileId: z.string(),
    status: z.nativeEnum(PaymentStatus),
    paymentDate: z.coerce.date().optional(),
    dueDate: z.coerce.date(),
  })
  const data = bodySchema.parse(request.body)
  const useCase = makeCreateDebtUseCase()
  const debt = await useCase.execute({
    planId: data.planId,
    planProfileId: data.planProfileId,
    amount: Money.from(data.value),
    status: data.status as DebtStatus,
    paymentDate: data.paymentDate,
    dueDate: data.dueDate,
  })
  return reply.status(201).send({ debt: DebtPresenter.toHTTP(debt) })
}
