import { makeUpdateLoanStatus } from '@/services/@factories/loan/make-update-loan-status'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RoleName } from '@prisma/client'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const UpdateLoanStatusController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CANCELED']),
  })
  const { id } = paramsSchema.parse(request.params)
  const { status } = bodySchema.parse(request.body)
  const user = request.user as UserToken
  if (
    user.role !== RoleName.ADMIN &&
    user.role !== RoleName.MANAGER &&
    user.role !== RoleName.OWNER
  )
    return reply.status(403).send({ message: 'Unauthorized' })
  const loanRepo = new PrismaLoanRepository()
  const unitRepo = new PrismaUnitRepository()
  const loanCheck = await loanRepo.findById(id)
  if (!loanCheck) return reply.status(404).send({ message: 'Loan not found' })
  const unit = await unitRepo.findById(loanCheck.unitId)
  if (user.role === RoleName.MANAGER && loanCheck.unitId !== user.unitId)
    return reply.status(403).send({ message: 'Unauthorized' })
  if (
    user.role === RoleName.OWNER &&
    unit?.organizationId !== user.organizationId
  )
    return reply.status(403).send({ message: 'Unauthorized' })

  const service = makeUpdateLoanStatus()
  const { loan, transactions } = await service.execute({
    loanId: id,
    status,
    updatedById: user.sub,
  })
  return reply.status(200).send({ loan, transactions })
}
