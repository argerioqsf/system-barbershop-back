import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { ListPendingCommissionAppointmentsUseCase } from '@/services/use-cases/collaborator/list-pending-commission-appointments-use-case'

export async function listPendingCommissionAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const listPendingCommissionAppointmentsParamsSchema = z.object({
    userId: z.string(),
  })

  const { userId } = listPendingCommissionAppointmentsParamsSchema.parse(
    request.params,
  )

  const appointmentRepository = new PrismaAppointmentRepository()
  const listPendingCommissionAppointmentsUseCase =
    new ListPendingCommissionAppointmentsUseCase(appointmentRepository)

  const appointments = await listPendingCommissionAppointmentsUseCase.execute(
    userId,
  )

  return reply.status(200).send(appointments)
}
