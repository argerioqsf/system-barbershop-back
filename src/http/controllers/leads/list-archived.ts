import makeGetLeadsArchivedService from '@/services/@factories/leads/make-get-leads-archived-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  indicatorId: z.string().optional(),
  consultantId: z.string().optional(),
})

export async function ListArchived(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const { q, page, indicatorId, consultantId } = searchBodySchema.parse(
    request.query,
  )

  const getLeadsArchivedService = makeGetLeadsArchivedService()

  const { leads, count } = await getLeadsArchivedService.execute({
    page,
    query: q,
    indicatorId,
    consultantId,
  })

  return replay.status(200).send({ leads, count })
}
