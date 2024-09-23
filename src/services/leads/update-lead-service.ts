import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads, Timeline } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { LeadsEmailExistsError } from '../@errors/leads-email-exists-error'
import { LeadsDocumentExistsError } from '../@errors/leads-document-exists-error'
import { SetConsultantNotPermitError } from '../@errors/set-consultant-not-permission'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'
import { CoursesRepository } from '@/repositories/course-repository'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'
import { LeadsNotFoundError } from '../@errors/leads-not-found-error'
import { InvalidCredentialsError } from '../@errors/invalid-credentials-error'
import { LeadNotReadyYetError } from '../@errors/lead-not-ready-yet-error'

interface UpdateLeadServiceRequest {
  id: string
  name: string
  phone: string
  document: string
  email: string
  city: string
  consultantId?: string | null
  unitId: string
  segmentId: string
  courseId: string
  userId: string
  released: boolean
}

interface UpdateLeadServiceResponse {
  lead: Leads
}

export class UpdateLeadService {
  constructor(
    private leadRepository: LeadsRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository,
    private segmentsRepository: SegmentsRepository,
  ) {}

  async execute({
    id,
    name,
    email,
    document,
    phone,
    city,
    consultantId,
    unitId,
    segmentId,
    courseId,
    userId,
    released,
  }: UpdateLeadServiceRequest): Promise<UpdateLeadServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)
    const lead = await this.leadRepository.findById(id)

    if (!profile) throw new UserNotFoundError()

    if (!lead) throw new LeadsNotFoundError()

    let verifyExistEmailLead = await this.leadRepository.find({
      email,
    })

    verifyExistEmailLead = verifyExistEmailLead.filter((lead) => lead.id !== id)

    if (verifyExistEmailLead.length > 0) throw new LeadsEmailExistsError()

    let verifyExistDocumentLead = await this.leadRepository.find({
      document,
    })

    verifyExistDocumentLead = verifyExistDocumentLead.filter(
      (lead) => lead.id !== id,
    )

    if (verifyExistDocumentLead.length > 0) throw new LeadsDocumentExistsError()

    let timeLine: Omit<
      Timeline,
      'id' | 'leadsId' | 'createdAt' | 'updatedAt'
    >[] = []

    if (unitId !== lead?.unitId) {
      const unit = await this.unitRepository.findById(unitId)

      if (!unit) throw new UnitNotFoundError()

      timeLine[0] = timeLine[0]
        ? {
            ...timeLine[0],
            description: timeLine[0].description.concat(
              ` ,Unidade alterada para ${unit.name}`,
            ),
          }
        : {
            description: `Unidade alterada para ${unit.name}`,
            status: 'Atualização',
            courseId,
            segmentId,
            unitId,
            title: '',
          }
    }

    if (courseId !== lead?.courseId) {
      const course = await this.coursesRepository.findById(courseId)

      if (!course) throw new CourseNotFoundError()

      timeLine[0] = timeLine[0]
        ? {
            ...timeLine[0],
            description: timeLine[0].description.concat(
              ` ,Curso alterado para ${course.name}`,
            ),
          }
        : {
            description: `Curso alterado para ${course.name}`,
            status: 'Atualização',
            courseId,
            segmentId,
            unitId,
            title: '',
          }
    }

    if (segmentId !== lead?.segmentId) {
      const segment = await this.segmentsRepository.findById(segmentId)

      if (!segment) throw new SegmentNotFoundError()

      timeLine[0] = timeLine[0]
        ? {
            ...timeLine[0],
            description: timeLine[0].description.concat(
              ` ,Seguimento alterado para ${segment.name}`,
            ),
          }
        : {
            description: `Seguimento alterado para ${segment.name}`,
            status: 'Atualização',
            courseId,
            segmentId,
            unitId,
            title: '',
          }
    }

    let data: { consultantId?: string | null; released?: boolean } = {
      consultantId: lead?.consultantId,
    }

    if (lead.released !== released) {
      if (profile.role === 'auxiliary' || profile.role === 'administrator') {
        data = {
          ...data,
          released,
        }
      } else {
        throw new InvalidCredentialsError()
      }
    }

    if (lead?.consultantId && !consultantId) {
      if (
        (lead.released === true &&
          (released === true || released === undefined)) ||
        released === true
      ) {
        if (profile.role === 'administrator' || profile.role === 'auxiliary') {
          timeLine = [
            ...timeLine,
            {
              description: `O consultor foi removido`,
              status: 'Consultor removido',
              courseId,
              segmentId,
              unitId,
              title: '',
            },
          ]
          data = { ...data, consultantId: null }
        } else {
          throw new SetConsultantNotPermitError()
        }
      } else {
        throw new LeadNotReadyYetError()
      }
    }

    if (consultantId && consultantId !== lead?.consultantId) {
      if (
        (lead.released === true &&
          (released === true || released === undefined)) ||
        released === true
      ) {
        const profileConsultant =
          await this.profileRepository.findById(consultantId)
        if (profileConsultant?.role === 'consultant') {
          if (
            profile.role === 'administrator' ||
            profile.role === 'auxiliary'
          ) {
            timeLine = [
              ...timeLine,
              {
                description: `O consultor ${profileConsultant.user.name} entrou em contato com o lead ${name}`,
                status: 'Pegou',
                courseId,
                segmentId,
                unitId,
                title: '',
              },
            ]
            data = { ...data, consultantId }
          } else {
            throw new SetConsultantNotPermitError()
          }
        } else {
          throw new SetConsultantNotPermitError()
        }
      } else {
        throw new LeadNotReadyYetError()
      }
    }

    const leadUp = await this.leadRepository.updateById(
      id,
      {
        id,
        name,
        city,
        document,
        email,
        phone,
        unitId,
        segmentId,
        courseId,
        ...data,
      },
      timeLine,
    )

    return {
      lead: leadUp,
    }
  }
}
