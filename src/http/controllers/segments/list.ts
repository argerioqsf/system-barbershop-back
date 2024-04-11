import { makeGetSegmentsService } from '@/services/@factories/segments/make-get-segments-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  q: z.string().optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, q } = searchBodySchema.parse(request.query)

  const getSegmentService = makeGetSegmentsService()

  const { segments } = await getSegmentService.execute({ page, query: q })

  return replay.status(200).send({
    segments,
  })
}
