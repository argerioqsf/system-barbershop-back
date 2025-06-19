import { makeResetPasswordWithTokenService } from '@/services/@factories/user/make-reset-password-with-token'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const ResetWithTokenController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    token: z.string(),
    password: z.string().min(6),
  })

  const { token, password } = bodySchema.parse(request.body)

  const service = makeResetPasswordWithTokenService()
  await service.execute({ token, password })

  return reply.status(200).send()
}
