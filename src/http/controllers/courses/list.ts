import { makeGetCoursesService } from '@/services/@factories/courses/make-get-courses-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { name, page } = searchBodySchema.parse(request.query)

  const getCoursesService = makeGetCoursesService()

  const { courses, count } = await getCoursesService.execute({ page, name })

  return replay.status(200).send({
    courses,
    count,
  })
}
