import { makeRegisterUserService } from '@/services/@factories/barber-user/make-register-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { CommissionCalcType } from '@prisma/client'
import { UserToken } from '../authenticate-controller'

export const CreateBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    genre: z.string().optional(),
    birthday: z.string().optional(),
    pix: z.string().optional(),
    unitId: z.string().optional(),
    roleId: z.string(),
    password: z.string().min(6),
    permissions: z.array(z.string()).optional(),
    commissionPercentage: z.number().optional(),
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
    permissions: data.permissions,
    commissionPercentage: data.commissionPercentage,
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
  })
  return reply.status(201).send({ user, profile })
}
