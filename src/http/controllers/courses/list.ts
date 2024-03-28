import { makeGetCoursesService } from '@/services/@factories/courses/make-get-courses-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function List(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const getCoursesService = makeGetCoursesService()

  const { courses } = await getCoursesService.execute()

  return replay.status(200).send({
    courses: {
      courses,
    },
  })
}
