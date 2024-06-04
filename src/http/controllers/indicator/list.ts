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
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, name, amountToReceive } = searchBodySchema.parse(request.query)

  const getIndicatorProfile = getIndicatorProfileService()

  const { users, count } = await getIndicatorProfile.execute({
    page,
    name,
    amountToReceive,
  })

  return replay.status(200).send({
    users,
    count,
  })
}
