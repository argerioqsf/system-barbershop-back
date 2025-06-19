import { makeRequestPasswordResetService } from '@/services/@factories/user/make-request-password-reset'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { withErrorHandling } from '@/utils/http-error-handler'

export const SendResetLinkController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      email: z.string().email(),
    })
    const { email } = bodySchema.parse(request.body)

    const service = makeRequestPasswordResetService()
    await service.execute({ email })

    return reply.status(200).send()
  },
)
