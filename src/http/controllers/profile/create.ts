import { makeCreateProfileService } from '@/services/@factories/profile/make-create-profile-service'

import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  phone: z.string(),
  cpf: z.string(),
  genre: z.string(),
  birthday: z.string(),
  pix: z.string(),
  role: z.nativeEnum(Role),
  roleModelId: z.string(),
  permissions: z.array(z.string()).optional(),
})

export const Create = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = bodySchema.parse(request.body)

  const createProfileService = makeCreateProfileService()

  const userId = request.user.sub

  const { profile } = await createProfileService.execute({
    phone: body.phone,
    cpf: body.cpf,
    genre: body.genre,
    birthday: body.birthday,
    pix: body.pix,
    role: body.role,
    roleModelId: body.roleModelId,
    userId,
    permissions: body.permissions,
  })
  return reply.status(201).send(profile)
}
