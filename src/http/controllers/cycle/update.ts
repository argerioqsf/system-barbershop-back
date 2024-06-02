import makeUpdateCycleService from '@/services/@factories/cycle/make-update-cycle-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const updateCycle = makeUpdateCycleService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { cycle } = await updateCycle.execute({ id })

    return reply.status(201).send(cycle)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
