import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads, Profile, Timeline, User } from '@prisma/client'
import { ConsultantNotFoundError } from '../@errors/consultant-not-found-error'
import { IndicatorNotFoundError } from '../@errors/indicator-not-found-error'
import { NoActiveCyclesError } from '../@errors/no-active-cycles-error'
import { OrganizationNotFoundError } from '../@errors/organization-not-found-error'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'
import { sendConfirmIndicatorPaymentEmail } from '@/lib/sendgrid'

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

    const data: {
      documents?: boolean
      matriculation?: boolean
      cycleId?: string
      amount_pay_indicator?: number
      amount_pay_consultant?: number
    } = {}

    let indicator: (Profile & { user: User }) | undefined

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

      indicator = indicatorLead

      const organization = organizations[0]

      if (!organization) {
        throw new OrganizationNotFoundError()
      }

      const cycles = organization.cycles
      const cycleId = cycles.find((cycle) => cycle.end_cycle === null)?.id

      if (!cycleId) {
        throw new NoActiveCyclesError()
      }

      await this.profileRepository.update(lead.indicatorId, {
        amountToReceive:
          (indicatorLead.amountToReceive ?? 0) + organization.indicator_bonus,
      })

      data.amount_pay_indicator =
        lead.amount_pay_indicator ?? 0 + organization.indicator_bonus

      await this.profileRepository.update(lead.consultantId, {
        amountToReceive:
          (consultantLead.amountToReceive ?? 0) + organization.consultant_bonus,
      })

      data.amount_pay_consultant =
        lead.amount_pay_consultant ?? 0 + organization.consultant_bonus

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
      data.cycleId = cycles.find((cycle) => cycle.end_cycle === null)?.id
    }

    const leadUp = await this.leadRepository.updateById(id, data, timeLine)

    if (documents !== undefined && indicator) {
      sendConfirmIndicatorPaymentEmail(
        indicator.user.email,
        indicator.user.name,
        leadUp,
      )
    }

    return {
      lead: leadUp,
    }
  }
}
