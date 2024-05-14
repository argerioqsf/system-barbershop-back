import { getConsultantProfileService } from '@/services/@factories/consultant/make-get-consultants-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  q: z.string().optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, q } = searchBodySchema.parse(request.query)

  const getConsultantProfile = getConsultantProfileService()

  const { users, count } = await getConsultantProfile.execute({
    page,
    query: q,
  })

  return replay.status(200).send({
    users,
    count,
  })
}
