import { makeCreateUnitCourseService } from '@/services/@factories/unit-course/make-create-unit-course-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  unitId: z.string(),
  courseId: z.string(),
})

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { unitId, courseId } = bodySchema.parse(request.body)

    const createUnitCourseService = makeCreateUnitCourseService()

    const { unitCourses } = await createUnitCourseService.execute({
      unitId,
      courseId,
    })

    return reply.status(201).send(unitCourses)
  } catch (error) {
    console.error('Error:', error)

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
