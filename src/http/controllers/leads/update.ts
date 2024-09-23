import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { InvalidCredentialsError } from '@/services/@errors/invalid-credentials-error'
import { LeadNotReadyYetError } from '@/services/@errors/lead-not-ready-yet-error'
import { LeadsDocumentExistsError } from '@/services/@errors/leads-document-exists-error'
import { LeadsEmailExistsError } from '@/services/@errors/leads-email-exists-error'
import { LeadsNotFoundError } from '@/services/@errors/leads-not-found-error'
import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { SetConsultantNotPermitError } from '@/services/@errors/set-consultant-not-permission'
import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import makeUpdateLeadService from '@/services/@factories/leads/make-update-leads-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  email: z.string(),
  city: z.string(),
  consultantId: z.string().optional().nullable(),
  unitId: z.string(),
  courseId: z.string(),
  segmentId: z.string(),
  released: z.boolean(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function Update(request: FastifyRequest, reply: FastifyReply) {
  const {
    name,
    phone,
    document,
    email,
    city,
    consultantId,
    unitId,
    courseId,
    segmentId,
    released,
  } = bodySchema.parse(request.body)

  const updateLeadService = makeUpdateLeadService()

  const userId = request.user.sub

  const { id } = routeSchema.parse(request.params)
  try {
    const { lead } = await updateLeadService.execute({
      name,
      phone,
      document,
      email,
      city,
      consultantId,
      unitId,
      id,
      courseId,
      segmentId,
      userId,
      released,
    })
    return reply.status(201).send(lead)
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof LeadsEmailExistsError) {
      return reply.status(409).send({ message: error.message })
    }
    if (error instanceof LeadsDocumentExistsError) {
      return reply.status(409).send({ message: error.message })
    }
    if (error instanceof UnitNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof SetConsultantNotPermitError) {
      return reply.status(401).send({ message: error.message })
    }
    if (error instanceof LeadNotReadyYetError) {
      return reply.status(404).send({ message: error.message })
    }
    if (error instanceof InvalidCredentialsError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
