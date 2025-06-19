import { makeResetPasswordWithTokenService } from '@/services/@factories/user/make-reset-password-with-token'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { handleControllerError } from '@/utils/http-error-handler'

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
    return handleControllerError(error, reply)
  }

  return reply.status(200).send()
}
