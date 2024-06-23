import { getIndicatorProfileService } from '@/services/@factories/indicator/make-get-indicator-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  name: z.string().optional(),
  amountToReceive: z
    .string()
    .transform((amountToReceive) => {
      return amountToReceive === 'null'
        ? null
        : amountToReceive === 'notnull'
          ? { gt: 0 }
          : Number(amountToReceive)
    })
    .optional(),
  active: z
    .string()
    .transform((archived) => {
      return archived === 'true'
        ? true
        : archived === 'false'
          ? false
          : undefined
    })
    .optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, name, amountToReceive, active } = searchBodySchema.parse(
    request.query,
  )

  const getIndicatorProfile = getIndicatorProfileService()

  const { users, count } = await getIndicatorProfile.execute({
    page,
    name,
    amountToReceive,
    active,
  })

  return replay.status(200).send({
    users,
    count,
  })
}
