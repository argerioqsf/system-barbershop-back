import { UserAlreadyExistsError } from '@/services/errors/user-already-exists-error'
import { makeUserService } from '@/services/factories/make-user-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function users(request: FastifyRequest, replay: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { name, email, password } = registerBodySchema.parse(request.body)

  try {
    const userService = makeUserService()

    await userService.execute({
      name,
      email,
      password,
    })
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }

  return replay.status(201).send()
}
