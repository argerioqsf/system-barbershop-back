import { makeUpdateUserService } from '@/services/@factories/barber-user/make-update-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function UpdateBarberUserController(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string(),
    phone: z.string(),
    cpf: z.string(),
    genre: z.string(),
    birthday: z.string(),
    pix: z.string(),
    role: z.nativeEnum(Role),
  })

  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateUserService()
  const result = await service.execute({ id, ...data })
  return reply.status(200).send(result)
}
