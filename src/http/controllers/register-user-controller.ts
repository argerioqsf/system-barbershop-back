import { UserAlreadyExistsError } from '@/services/@errors/user-already-exists-error'
import { makeRegisterService } from '@/services/@factories/make-register-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function registerUser(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
    role: z.nativeEnum(Role),
    organizationId: z.string(),
  })

  const data = registerBodySchema.parse(request.body)

  try {
    const registerService = makeRegisterService()

    await registerService.execute(data)
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }

  return replay.status(201).send()
}
