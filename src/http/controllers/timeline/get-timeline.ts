import { TimelineNotFoundError } from '@/services/@errors/timeline-not-found'
import makeGetTimelineService from '@/services/@factories/timeline/make-get-timeline-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getTimeline(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const getTimelineService = makeGetTimelineService()

  try {
    const { timeline } = await getTimelineService.execute({ id })

    return reply.status(200).send(timeline)
  } catch (error) {
    if (error instanceof TimelineNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
