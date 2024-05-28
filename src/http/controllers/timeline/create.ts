import { LeadsNotFoundError } from '@/services/@errors/leads-not-found-error'
import { makeCreateTimelineService } from '@/services/@factories/timeline/make-create-timeline-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.string(),
})

const routeSchema = z.object({
  leadId: z.string(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body)

  const createTimelineService = makeCreateTimelineService()

  const { leadId } = routeSchema.parse(request.params)

  try {
    const { timeline } = await createTimelineService.execute({
      ...body,
      leadsId: leadId,
    })
    return reply.status(201).send(timeline)
  } catch (error) {
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    console.log('error ---', error)
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
