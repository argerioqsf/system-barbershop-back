import { makeGetCollaboratorDashboardUseCase } from '@/modules/collaborator/infra/factories/make-get-collaborator-dashboard.use-case'
import { FastifyRequest, FastifyReply } from 'fastify'

export async function getCollaboratorDashboardController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const collaboratorId = request.user.sub

  const getCollaboratorDashboardUseCase = makeGetCollaboratorDashboardUseCase()

  const dashboard = await getCollaboratorDashboardUseCase.execute({
    collaboratorId,
  })

  return reply.status(200).send(dashboard)
}
