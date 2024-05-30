import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads, Timeline } from '@prisma/client'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'
import { CoursesRepository } from '@/repositories/course-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

interface UpdateLeadStatusServiceRequest {
  id: string
  documents?: boolean
  matriculation?: boolean
  userId: string
  unitId: string
  courseId: string
  segmentId: string
}

interface UpdateLeadStatusServiceResponse {
  lead: Leads
}

export class UpdateLeadStatusService {
  constructor(
    private leadRepository: LeadsRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private coursesRepository: CoursesRepository,
    private segmentsRepository: SegmentsRepository,
  ) {}

  async execute({
    id,
    documents,
    matriculation,
    userId,
    unitId,
    courseId,
    segmentId,
  }: UpdateLeadStatusServiceRequest): Promise<UpdateLeadStatusServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)
    const unit = await this.unitRepository.findById(unitId)
    const course = await this.coursesRepository.findById(courseId)
    const segment = await this.segmentsRepository.findById(segmentId)

    if (!unit) throw new UnitNotFoundError()

    if (!course) throw new CourseNotFoundError()

    if (!segment) throw new SegmentNotFoundError()

    if (profile?.role !== 'administrator') {
      throw new UserTypeNotCompatible()
    }

    let timeLine: Omit<
      Timeline,
      'id' | 'leadsId' | 'createdAt' | 'updatedAt'
    >[] = [
      {
        description: '',
        status: '',
        courseId,
        segmentId,
        unitId,
        title: '',
      },
    ]

    if (documents) {
      timeLine = [
        {
          description: 'Documentos entregue',
          status: 'Status atualizado',
          courseId,
          segmentId,
          unitId,
          title: '',
        },
      ]
    }

    if (matriculation) {
      timeLine = [
        {
          description: 'Matricula Realizada',
          status: 'Status atualizado',
          courseId,
          segmentId,
          unitId,
          title: '',
        },
      ]
    }

    const lead = await this.leadRepository.updateById(
      id,
      {
        documents,
        matriculation,
        courseId,
        segmentId,
        unitId,
      },
      timeLine,
    )

    return {
      lead,
    }
  }
}
