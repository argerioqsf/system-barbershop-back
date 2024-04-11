import { makeGetCoursesService } from '@/services/@factories/courses/make-get-courses-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { q, page } = searchBodySchema.parse(request.query)

  const getCoursesService = makeGetCoursesService()

  const { courses } = await getCoursesService.execute({ page, query: q })

  return replay.status(200).send({
    courses: {
      courses,
    },
  })
}
