import { makeResetPasswordWithTokenService } from '@/services/@factories/user/make-reset-password-with-token'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { ResourceNotFoundError } from '@/services/@errors/resource-not-found-error'

export async function ResetWithTokenController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    token: z.string(),
    password: z.string().min(6),
  })

  const { token, password } = bodySchema.parse(request.body)

  try {
    const service = makeResetPasswordWithTokenService()
    await service.execute({ token, password })
  } catch (error) {
    if (
      error instanceof UserNotFoundError ||
      error instanceof ResourceNotFoundError
    ) {
      return reply.status(400).send({ message: error.message })
    }
    throw error
  }

  return reply.status(200).send()
}
