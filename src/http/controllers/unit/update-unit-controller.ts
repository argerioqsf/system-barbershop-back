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
  })
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { name, slug, allowsLoan } = bodySchema.parse(request.body)
  const { id } = paramsSchema.parse(request.params)
  const service = makeUpdateUnitService()
  const { unit } = await service.execute({ id, name, slug, allowsLoan })
  return reply.status(200).send(unit)
}
