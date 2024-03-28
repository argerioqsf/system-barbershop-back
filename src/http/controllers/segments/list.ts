
import { makeGetSegmentsService } from '@/services/@factories/segments/make-get-segments-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function List(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const getSegmentService = makeGetSegmentsService()

  const { segments } = await getSegmentService.execute()

  return replay.status(200).send({
    segments,
  })
}
