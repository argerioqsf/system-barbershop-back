import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { makeSentContractService } from '@/services/@factories/indicator/make-sent-contract-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  contractLink: z.string(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function SentContract(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { contractLink } = bodySchema.parse(request.body)

  const sentContractService = makeSentContractService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { profile } = await sentContractService.execute({
      id,
      contractLink,
    })
    if (profile) {
      return reply.status(201).send(profile)
    } else {
      return reply.status(500).send({ message: 'Erro ao enviar email' })
    }
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
