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

    if (!lead) {
      throw new UserTypeNotCompatible()
    }

    let timeLine: Omit<
      Timeline,
      'id' | 'leadsId' | 'createdAt' | 'updatedAt'
    >[] = []

    const data: { documents?: boolean; matriculation?: boolean } = {}

    if (documents !== undefined) {
      if (profile?.role !== 'secretary') {
        throw new UserTypeNotCompatible()
      }
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
      data.documents = documents
    }

    if (matriculation !== undefined) {
      if (profile?.role !== 'administrator') {
        throw new UserTypeNotCompatible()
      }
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
      data.matriculation = matriculation
    }

    const leadUp = await this.leadRepository.updateById(id, data, timeLine)

    return {
      lead: leadUp,
    }
  }
}
