import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import makeGetLeadsService from '@/services/@factories/leads/make-get-leads-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  indicatorId: z.string().optional(),
  matriculation: z
    .string()
    .transform((matriculation) => {
      return matriculation === 'true'
        ? true
        : matriculation === 'false'
          ? false
          : undefined
    })
    .optional(),
  consultantId: z
    .string()
    .transform((consultantId) => {
      return consultantId === 'null'
        ? null
        : consultantId === 'notnull'
          ? { not: null }
          : consultantId
    })
    .optional(),
  archived: z
    .string()
    .transform((archived) => {
      return archived === 'true'
        ? true
        : archived === 'false'
          ? false
          : undefined
    })
    .optional(),
  released: z
    .string()
    .transform((released) => {
      return released === 'true'
        ? true
        : released === 'false'
          ? false
          : undefined
    })
    .optional(),
  segmentId: z
    .string()
    .transform((segmentId) => {
      return segmentId === '' ? undefined : segmentId
    })
    .optional(),
  courseId: z
    .string()
    .transform((courseId) => {
      return courseId === '' ? undefined : courseId
    })
    .optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const {
    name,
    phone,
    page,
    indicatorId,
    consultantId,
    segmentId,
    courseId,
    archived,
    matriculation,
    released,
  } = searchBodySchema.parse(request.query)

  const userId = request.user.sub

  const getLeadsService = makeGetLeadsService()

  try {
    const { leads, count } = await getLeadsService.execute({
      page,
      phone,
      name,
      indicatorId,
      consultantId,
      segmentId,
      courseId,
      userId,
      archived,
      matriculation,
      released,
    })

    return replay.status(200).send({ leads, count })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return replay.status(404).send({ message: error.message })
    }

    return replay.status(500).send({ message: 'Internal server error' })
  }
}
