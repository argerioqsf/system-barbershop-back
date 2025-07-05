import { makeUpdateUnitService } from '@/services/@factories/unit/make-update-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateUnitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    allowsLoan: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
    loanMonthlyLimit: z.coerce.number().optional(),
    appointmentFutureLimitDays: z.coerce.number().optional(),
  })
  const paramsSchema = z.object({
    id: z.string(),
  })
  const {
    name,
    slug,
    allowsLoan,
    loanMonthlyLimit,
    appointmentFutureLimitDays,
  } = bodySchema.parse(request.body)
  const { id } = paramsSchema.parse(request.params)
  const service = makeUpdateUnitService()
  const { unit } = await service.execute({
    id,
    name,
    slug,
    allowsLoan,
    loanMonthlyLimit,
    appointmentFutureLimitDays,
  })
  return reply.status(200).send(unit)
}
