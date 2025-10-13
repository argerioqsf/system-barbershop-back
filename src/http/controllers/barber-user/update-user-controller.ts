import { makeUpdateUserService } from '@/services/@factories/barber-user/make-update-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { CommissionCalcType } from '@prisma/client'
import { UserToken } from '../authenticate-controller'

export const UpdateBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    genre: z.string().optional(),
    birthday: z.string().optional(),
    pix: z.string().optional(),
    unitId: z.string().optional(),
    roleId: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    commissionPercentage: z.number().optional(),
    active: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
    services: z
      .array(
        z.object({
          serviceId: z.string(),
          time: z.number().int().nullable().optional(),
          commissionPercentage: z.number().nullable().optional(),
          commissionType: z
            .nativeEnum(CommissionCalcType)
            .nullable()
            .optional(),
        }),
      )
      .optional(),
    products: z
      .array(
        z.object({
          productId: z.string(),
          commissionPercentage: z.number().nullable().optional(),
          commissionType: z
            .nativeEnum(CommissionCalcType)
            .nullable()
            .optional(),
        }),
      )
      .optional(),
    removeServiceIds: z.array(z.string()).optional(),
    removeProductIds: z.array(z.string()).optional(),
  })

  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateUserService()
  const userToken = request.user as UserToken

  const normalized = {
    ...data,
    services: data.services?.map((s) => ({
      serviceId: s.serviceId,
      time: s.time ?? undefined,
      commissionPercentage: s.commissionPercentage ?? undefined,
      commissionType: s.commissionType ?? undefined,
    })),
    products: data.products?.map((p) => ({
      productId: p.productId,
      commissionPercentage: p.commissionPercentage ?? undefined,
      commissionType: p.commissionType ?? undefined,
    })),
  }

  const { user } = await service.execute(
    { id, ...normalized },
    userToken,
    reply,
    request,
  )

  return reply.status(200).send({ user })
}
