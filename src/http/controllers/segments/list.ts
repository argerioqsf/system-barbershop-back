import { makeGetSegmentsService } from '@/services/@factories/segments/make-get-segments-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  name: z.string().optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, name } = searchBodySchema.parse(request.query)

  const getSegmentService = makeGetSegmentsService()

  const { segments, count } = await getSegmentService.execute({
    page,
    name,
  })

  return replay.status(200).send({
    segments,
    count,
  })
}
