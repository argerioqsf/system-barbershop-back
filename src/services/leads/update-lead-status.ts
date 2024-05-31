import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads, Timeline } from '@prisma/client'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'

interface UpdateLeadStatusServiceRequest {
  id: string
  documents?: boolean
  matriculation?: boolean
  userId: string
}

interface UpdateLeadStatusServiceResponse {
  lead: Leads
}

export class UpdateLeadStatusService {
  constructor(
    private leadRepository: LeadsRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    id,
    documents,
    matriculation,
    userId,
  }: UpdateLeadStatusServiceRequest): Promise<UpdateLeadStatusServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)
    const lead = await this.leadRepository.findById(id)

    if (profile?.role !== 'administrator') {
      throw new UserTypeNotCompatible()
    }

    if (!lead) {
      throw new UserTypeNotCompatible()
    }

    let timeLine: Omit<
      Timeline,
      'id' | 'leadsId' | 'createdAt' | 'updatedAt'
    >[] = [
      {
        description: '',
        status: '',
        courseId: lead?.courseId,
        segmentId: lead?.segmentId,
        unitId: lead?.unitId,
        title: '',
      },
    ]

    if (documents) {
      timeLine = [
        {
          description: 'Documentos entregue',
          status: 'Status atualizado',
          courseId: lead?.courseId,
          segmentId: lead?.segmentId,
          unitId: lead?.unitId,
          title: '',
        },
      ]
    }

    if (matriculation) {
      timeLine = [
        {
          description: 'Matricula Realizada',
          status: 'Status atualizado',
          courseId: lead?.courseId,
          segmentId: lead?.segmentId,
          unitId: lead?.unitId,
          title: '',
        },
      ]
    }

    const leadUp = await this.leadRepository.updateById(
      id,
      {
        documents,
        matriculation,
        courseId: lead?.courseId,
        segmentId: lead?.segmentId,
        unitId: lead?.unitId,
      },
      timeLine,
    )

    return {
      lead: leadUp,
    }
  }
}
