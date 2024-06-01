import makeCreateCycleService from '@/services/@factories/cycle/make-create-cycle-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  start_cycle: z.date().optional(),
  end_cycle: z.date().optional(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body)

  const createCycleService = makeCreateCycleService()

  try {
    const { cycle } = await createCycleService.execute({ ...body })

    return reply.status(201).send(cycle)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
