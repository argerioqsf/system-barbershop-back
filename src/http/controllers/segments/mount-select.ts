import { makeMountSelectSegmentsService } from '@/services/@factories/segments/mount-select-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function MountSelect(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  console.log('MountSelect segment')
  const getMountSelectSegmentService = makeMountSelectSegmentsService()

  const { segments } = await getMountSelectSegmentService.execute()

  return replay.status(200).send({
    segments,
  })
}
