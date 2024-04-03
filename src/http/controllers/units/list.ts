import { makeGetCoursesService } from '@/services/@factories/courses/make-get-courses-service'
import { makeGetUnitsService } from '@/services/@factories/units/make-get-units-services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const getUnitService = makeGetUnitsService()
  const courses = makeGetCoursesService()

  const { units } = await getUnitService.execute()

  return replay.status(200).send({
    units,
  })
}
