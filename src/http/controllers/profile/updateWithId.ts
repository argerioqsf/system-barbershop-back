import { ResourceNotFoundError } from '@/services/@errors/resource-not-found-error'
import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { MakeUpdateProfileUserService } from '@/services/@factories/profile/update-profile-user-service'
import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  phone: z.string(),
  cpf: z.string(),
  genre: z.string(),
  birthday: z.string(),
  pix: z.string(),
  role: z.nativeEnum(Role),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function UpdateWithId(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    active,
    birthday,
    cpf,
    email,
    genre,
    name,
    phone,
    pix,
    role,
  } = bodySchema.parse(request.body)

  const updateProfileUserService = MakeUpdateProfileUserService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { profile } = await updateProfileUserService.execute({
      active,
      birthday,
      cpf,
      email,
      genre,
      id,
      name,
      phone,
      pix,
      role,
    })
    return reply.status(201).send({ profile })
  } catch (error) {
    if (error instanceof UnitNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
