import { UserAlreadyExistsError } from '@/services/@errors/user-already-exists-error'
import { makeRegisterIndicatorProfileService } from '@/services/@factories/indicator/make-register-indicator-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function RegisterIndicatorController(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    active: z.boolean().default(false),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
  })

  const body = registerBodySchema.parse(request.body)

  try {
    const RegisterIndicatorProfileService =
      makeRegisterIndicatorProfileService()

    const { profile } = await RegisterIndicatorProfileService.execute({
      ...body,
    })

    return replay.status(200).send({
      profile,
    })
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }
}
