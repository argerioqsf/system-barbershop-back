import { makeRegisterService } from '@/services/@factories/make-register-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { handleControllerError } from '@/utils/http-error-handler'

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
    unitId: z.string(),
  })

  const data = registerBodySchema.parse(request.body)

  if (data.role === 'ADMIN' || data.role === 'OWNER') {
    return replay.status(403).send({ message: 'Unauthorized role' })
  }

  try {
    const registerService = makeRegisterService()

    await registerService.execute({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      cpf: data.cpf,
      genre: data.genre,
      birthday: data.birthday,
      pix: data.pix,
      role: data.role,
      unitId: data.unitId,
    })
  } catch (error) {
    return handleControllerError(error, replay)
  }

  return replay.status(201).send()
}
