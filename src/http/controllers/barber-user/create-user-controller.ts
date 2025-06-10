import { makeRegisterUserService } from '@/services/@factories/barber-user/make-register-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function CreateBarberUserController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
    role: z.nativeEnum(Role),
  })

  const data = bodySchema.parse(request.body)
  const service = makeRegisterUserService()
  const { user, profile } = await service.execute(data)
  return reply.status(201).send({ user, profile })
}
