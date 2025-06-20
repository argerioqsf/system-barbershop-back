import { makeRegisterService } from '@/services/@factories/make-register-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from './authenticate-controller'

export const registerUser = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
    unitId: z.string(),
    roleId: z.string(),
    permissions: z.array(z.string()).optional(),
  })

  const data = registerBodySchema.parse(request.body)

  // if (data.role === RoleName.ADMIN || data.role === RoleName.OWNER) {
  //   return replay.status(403).send({ message: 'Unauthorized role' })
  // }

  const registerService = makeRegisterService()

  const user = request.user as UserToken
  await registerService.execute(user, {
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    cpf: data.cpf,
    genre: data.genre,
    birthday: data.birthday,
    pix: data.pix,
    roleId: data.roleId,
    unitId: data.unitId,
    permissions: data.permissions,
  })

  return replay.status(201).send()
}
