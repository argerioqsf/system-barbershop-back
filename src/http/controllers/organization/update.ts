import { UserTypeNotCompatible } from '@/services/@errors/user-type-not-compatible'
import makeUpdateOrganizationService from '@/services/@factories/organization/make-update-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  consultant_bonus: z.number(),
  indicator_bonus: z.number(),
  slug: z.string(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const { name, consultant_bonus, indicator_bonus, slug } = bodySchema.parse(
    request.body,
  )

  const updateOrganizationService = makeUpdateOrganizationService()

  const userId = request.user.sub

  const { id } = routeSchema.parse(request.params)
  try {
    const { organization } = await updateOrganizationService.execute({
      name,
      consultant_bonus,
      indicator_bonus,
      slug,
      id,
      userId,
    })
    return reply.status(201).send(organization)
  } catch (error) {
    if (error instanceof UserTypeNotCompatible) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
