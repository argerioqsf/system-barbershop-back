import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import makeGetLeadsService from '@/services/@factories/leads/make-get-leads-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  indicatorId: z.string().optional(),
  consultantId: z.string().optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { q, page, indicatorId, consultantId } = searchBodySchema.parse(
    request.query,
  )

  const userId = request.user.sub

  const getLeadsService = makeGetLeadsService()

  try {
    const { leads, count } = await getLeadsService.execute({
      page,
      query: q,
      indicatorId,
      consultantId,
      userId,
    })

    return replay.status(200).send({ leads, count })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return replay.status(404).send({ message: error.message })
    }

    return replay.status(500).send({ message: 'Internal server error' })
  }
}
