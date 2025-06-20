import { makeRegisterService } from '@/services/@factories/make-register-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import type { Role } from '@/@types/roles'
import { z } from 'zod'

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
    role: z.enum(['ADMIN','BARBER','CLIENT','ATTENDANT','MANAGER','OWNER']),
    unitId: z.string(),
    roleId: z.string(),
    permissions: z.array(z.string()).optional(),
  })

  const data = registerBodySchema.parse(request.body)

  if (data.role === 'ADMIN' || data.role === 'OWNER') {
    return replay.status(403).send({ message: 'Unauthorized role' })
  }

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
    roleId: data.roleId,
    unitId: data.unitId,
    permissions: data.permissions,
  })

  return replay.status(201).send()
}
