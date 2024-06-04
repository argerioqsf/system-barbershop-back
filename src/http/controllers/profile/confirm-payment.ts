import { ProfileNotFoundError } from '@/services/@errors/profile-not-found-error'
import { makeConfirmPaymentService } from '@/services/@factories/profile/make-confirm-payment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function ConfirmPayment(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const confirmPaymentService = makeConfirmPaymentService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { profile } = await confirmPaymentService.execute({ id })
    return reply.status(201).send({ profile })
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
