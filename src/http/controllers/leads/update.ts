import makeUpdateLeadService from '@/services/@factories/leads/make-update-leads-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  email: z.string(),
  city: z.string(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const { name, phone, document, email, city } = bodySchema.parse(request.body)

  const updateLeadService = makeUpdateLeadService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { lead } = await updateLeadService.execute({
      id,
      name,
      phone,
      city,
      document,
      email,
    })
    return reply.status(201).send(lead)
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
