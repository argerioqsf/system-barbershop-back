import { makeRequestPasswordResetService } from '@/services/@factories/user/make-request-password-reset'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'

export async function SendResetLinkController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    email: z.string().email(),
  })
  const { email } = bodySchema.parse(request.body)

  try {
    const service = makeRequestPasswordResetService()
    await service.execute({ email })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    throw error
  }

  return reply.status(200).send()
}
