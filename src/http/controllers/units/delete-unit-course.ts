import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeDeleteUnitCourseService } from '@/services/@factories/units/make-delete-unit-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  unitId: z.string(),
  courseId: z.string(),
})

export async function deleteUnitCourse(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { unitId, courseId } = routeSchema.parse(request.params)

  const deleteUnitCourseService = makeDeleteUnitCourseService()

  try {
    const { unitCourse } = await deleteUnitCourseService.execute({
      unitId,
      courseId,
    })

    return reply
      .status(200)
      .send({ message: 'unit course deleted', unitCourse })
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
