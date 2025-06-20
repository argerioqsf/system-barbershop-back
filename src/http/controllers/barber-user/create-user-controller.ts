import { makeRegisterUserService } from '@/services/@factories/barber-user/make-register-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
    unitId: z.string().optional(),
    roleId: z.string(),
  })

  const data = bodySchema.parse(request.body)
  const service = makeRegisterUserService()
  const userToken = request.user as UserToken

  let unitId = userToken.unitId

  if (userToken.role === 'ADMIN') {
    unitId = data.unitId ?? unitId
  }

  const { user, profile } = await service.execute(userToken, {
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    cpf: data.cpf,
    genre: data.genre,
    birthday: data.birthday,
    pix: data.pix,
    roleId: data.roleId,
    unitId,
  })
  return reply.status(201).send({ user, profile })
}
