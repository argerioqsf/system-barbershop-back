import { makeMountSelectCourseService } from '@/services/@factories/courses/mount-select-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function MountSelect(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  const getMountSelectCoursesService = makeMountSelectCourseService()

  const { courses } = await getMountSelectCoursesService.execute()

  return replay.status(200).send({ courses })
}
