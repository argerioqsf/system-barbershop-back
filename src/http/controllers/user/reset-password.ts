import { InvalidCredentialsError } from '@/services/@errors/invalid-credentials-error'
import { ProfileNotFoundError } from '@/services/@errors/profile-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { makeResetPasswordService } from '@/services/@factories/user/reset-password-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function ResetPasswordUser(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const registerBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const body = registerBodySchema.parse(request.body)

  const userId = request.user.sub

  try {
    const resetPasswordService = makeResetPasswordService()

    const { user } = await resetPasswordService.execute({
      ...body,
      userId,
    })

    return replay.status(200).send({
      user,
    })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return replay.status(409).send({ message: error.message })
    }
    if (error instanceof InvalidCredentialsError) {
      return replay.status(409).send({ message: error.message })
    }
    if (error instanceof ProfileNotFoundError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }
}
