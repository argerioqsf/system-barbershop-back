import { getMountSelectIndicatorProfileService } from '@/services/@factories/indicator/make-mount-select-indicator-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function MountSelect(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const mountSelectIndicatorService = getMountSelectIndicatorProfileService()

  const { users } = await mountSelectIndicatorService.execute()

  return replay.status(200).send({ users })
}
