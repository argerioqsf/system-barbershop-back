import { UserAlreadyExistsError } from '@/services/errors/user-already-exists-error'
import { makeRegisterService } from '@/services/factories/make-register-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function register(request: FastifyRequest, replay: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    active: z.boolean().default(false),
  })

  const { name, email, password, active } = registerBodySchema.parse(
    request.body,
  )

  try {
    const registerService = makeRegisterService()

    await registerService.execute({
      name,
      email,
      password,
      active,
    })
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }

  return replay.status(201).send()
}
