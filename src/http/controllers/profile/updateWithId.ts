import { MakeUpdateProfileUserService } from '@/services/@factories/profile/update-profile-user-service'
import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { withErrorHandling } from '@/utils/http-error-handler'

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

export const UpdateWithId = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { active, birthday, cpf, email, genre, name, phone, pix, role } =
    bodySchema.parse(request.body)

  const updateProfileUserService = MakeUpdateProfileUserService()

  const { id } = routeSchema.parse(request.params)

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
})
