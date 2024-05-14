import { ConsultantNotFoundError } from '@/services/@errors/consultant-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { makeGetConsultantService } from '@/services/@factories/consultant/make-get-consultant-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function GetConsultantProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const getConsultant = makeGetConsultantService()

  try {
    const { user } = await getConsultant.execute({ id })

    return reply.status(200).send(user)
  } catch (error) {
    if (error instanceof ConsultantNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
