import { makeUpdateUserService } from '@/services/@factories/barber-user/make-update-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function UpdateBarberUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    genre: z.string().optional(),
    birthday: z.string().optional(),
    pix: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    active: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
  })

  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateUserService()
  const result = await service.execute({ id, ...data })
  return reply.status(200).send(result)
}
