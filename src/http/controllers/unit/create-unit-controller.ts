import { makeCreateUnitService } from '@/services/@factories/unit/make-create-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateUnitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    slug: z.string(),
    organizationId: z.string().optional(),
    allowsLoan: z.boolean().optional(),
    loanMonthlyLimit: z.number().optional(),
    appointmentFutureLimitDays: z.number().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateUnitService()
  const userToken = request.user as UserToken
  const { unit } = await service.execute({
    name: data.name,
    slug: data.slug,
    organizationId: data.organizationId,
    allowsLoan: data.allowsLoan,
    loanMonthlyLimit: data.loanMonthlyLimit,
    appointmentFutureLimitDays: data.appointmentFutureLimitDays,
    userToken,
  })
  return reply.status(201).send(unit)
}
