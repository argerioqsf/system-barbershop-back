import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads, Timeline } from '@prisma/client'
import { LeadsEmailExistsError } from '../@errors/leads-email-exists-error'
import { LeadsDocumentExistsError } from '../@errors/leads-document-exists-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { CoursesRepository } from '@/repositories/course-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface CreateLeadPublicServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId: string
  unitId: string
  courseId: string
  segmentId: string
}

interface CreateLeadPublicServiceResponse {
  leads: Leads
}

export class CreateLeadPublicService {
  constructor(
    private leadsRepository: LeadsRepository,
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository,
    private segmentsRepository: SegmentsRepository,
  ) {}

  async execute({
    name,
    phone,
    document,
    email,
    city,
    indicatorId,
    unitId,
    courseId,
    segmentId,
  }: CreateLeadPublicServiceRequest): Promise<CreateLeadPublicServiceResponse> {
    const unit = await this.unitRepository.findById(unitId)
    const course = await this.coursesRepository.findById(courseId)
    const segment = await this.segmentsRepository.findById(segmentId)

    if (!unit) throw new UnitNotFoundError()

    if (!course) throw new CourseNotFoundError()

    if (!segment) throw new SegmentNotFoundError()

    const verifyExistEmailLead = await this.leadsRepository.find({
      email,
    })

    if (verifyExistEmailLead.length > 0) throw new LeadsEmailExistsError()

    const verifyExistDocumentLead = await this.leadsRepository.find({
      document,
    })

    if (verifyExistDocumentLead.length > 0) throw new LeadsDocumentExistsError()

    const timeLine: Omit<
      Timeline,
      'id' | 'leadsId' | 'createdAt' | 'updatedAt'
    >[] = [
      {
        description: '',
        status: 'Novo Lead',
        courseId,
        segmentId,
        unitId,
        title: '',
      },
    ]

    const leads = await this.leadsRepository.create(
      {
        name,
        phone,
        document,
        email,
        city,
        indicatorId,
        unitId,
        courseId,
        segmentId,
      },
      timeLine,
    )

    return { leads }
  }
}
