import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSearchCourseService } from '@/services/@factories/courses/make-search-course-service'

const searchBodySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
})

export async function Search(request: FastifyRequest, reply: FastifyReply) {
  const { q, page } = searchBodySchema.parse(request.query)

  const searchCoursesService = makeSearchCourseService()

  try {
    const { courses } = await searchCoursesService.execute({
      query: q,
      page,
    })

    return reply.status(200).send({ courses })
  } catch (error) {
    console.error(error)

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
