import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads, Timeline } from '@prisma/client'
import { ConsultantNotFoundError } from '../@errors/consultant-not-found-error'
import { IndicatorNotFoundError } from '../@errors/indicator-not-found-error'
import { OrganizationNotFoundError } from '../@errors/organization-not-found-error'
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

    if (documents !== undefined) {
      if (profile?.role !== 'secretary' && profile?.role !== 'administrator') {
        throw new UserTypeNotCompatible()
      }

      if (!profile.user.organizations) {
        throw new OrganizationNotFoundError()
      }

      const organizations = profile.user.organizations.map(
        (org) => org.organization,
      )

      if (!lead.consultantId) {
        throw new ConsultantNotFoundError()
      }

      const consultantLead = await this.profileRepository.findById(
        lead.consultantId,
      )

      if (!consultantLead) {
        throw new ConsultantNotFoundError()
      }

      if (!lead.indicatorId) {
        throw new IndicatorNotFoundError()
      }

      const indicatorLead = await this.profileRepository.findById(
        lead.indicatorId,
      )

      if (!indicatorLead) {
        throw new IndicatorNotFoundError()
      }

      await this.profileRepository.update(lead.indicatorId, {
        amountToReceive:
          (indicatorLead.amountToReceive ?? 0) +
          organizations[0].indicator_bonus,
      })

      await this.profileRepository.update(lead.consultantId, {
        amountToReceive:
          (consultantLead.amountToReceive ?? 0) +
          organizations[0].consultant_bonus,
      })

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

    const leadUp = await this.leadRepository.updateById(id, data, timeLine)

    return {
      lead: leadUp,
    }
  }
}
