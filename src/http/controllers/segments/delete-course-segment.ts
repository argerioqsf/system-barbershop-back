import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeDeleteSegmentCourseService } from '@/services/@factories/segments/make-delete-course-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  segmentId: z.string(),
  courseId: z.string(),
})

export async function deleteCourseSegment(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { courseId, segmentId } = routeSchema.parse(request.params)

  const deleteSegmentCourseService = makeDeleteSegmentCourseService()

  try {
    const { courseSegment } = await deleteSegmentCourseService.execute({
      segmentId,
      courseId,
    })

    return reply
      .status(200)
      .send({ message: 'course segment deleted', courseSegment })
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
