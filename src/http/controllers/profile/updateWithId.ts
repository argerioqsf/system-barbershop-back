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
  city: z.string(),
  unitId: z.string().optional(),
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
    city,
    cpf,
    email,
    genre,
    name,
    phone,
    pix,
    role,
    unitId,
  } = bodySchema.parse(request.body)

  const updateProfileUserService = MakeUpdateProfileUserService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { profile } = await updateProfileUserService.execute({
      active,
      birthday,
      city,
      cpf,
      email,
      genre,
      id,
      name,
      phone,
      pix,
      role,
      unitId,
    })
    return reply.status(201).send({ profile })
  } catch (error) {
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
