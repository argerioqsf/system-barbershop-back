import { makeMountSelectUnitsService } from '@/services/@factories/units/mount-select-units-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function MountSelectUnit(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const getMountSelectUnitService = makeMountSelectUnitsService()

  const { units } = await getMountSelectUnitService.execute()

  return replay.status(200).send({ units })
}
