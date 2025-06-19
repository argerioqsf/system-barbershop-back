import { makeRequestPasswordResetService } from '@/services/@factories/user/make-request-password-reset'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { handleControllerError } from '@/utils/http-error-handler'

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
    return handleControllerError(error, reply)
  }

  return reply.status(200).send()
}
