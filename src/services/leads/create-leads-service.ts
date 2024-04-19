import { LeadsRepository } from '@/repositories/leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { Leads } from '@prisma/client'
import { AdministratorCreateIndicatorNotFound } from '../@errors/administrator-create-indicator-not-found'
import { IndicatorNotFoundError } from '../@errors/indicator-not-found-error'
import { NeedIndicatorField } from '../@errors/need-indicator-field'
import { SetConsultantNotPermitError } from '../@errors/set-consultant-not-permission'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { PrismaTimelineRepository } from '@/repositories/prisma/prisma-timeline-repository'

interface CreateLeadsServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId?: string
  consultantId?: string
  userId: string
}

interface CreateLeadsServiceResponse {
  leads: Leads
}

export class CreateLeadsService {
  constructor(
    private leadsRepository: LeadsRepository,
    private profileRepository: PrismaProfilesRepository,
    private timelineRepository: PrismaTimelineRepository,
  ) {}

  async execute({
    name,
    phone,
    document,
    email,
    city,
    userId,
    indicatorId,
    consultantId,
  }: CreateLeadsServiceRequest): Promise<CreateLeadsServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) throw new UserNotFoundError()

    let data: { indicatorId: string; consultantId?: string } = {
      indicatorId: '',
    }

    let timeLine = [
      {
        descriptionTL: '',
        statusTL: 'Novo Lead',
      },
    ]

    if (indicatorId) {
      if (profile.role === 'indicator') {
        throw new AdministratorCreateIndicatorNotFound()
      } else {
        const profileIndicator =
          await this.profileRepository.findById(indicatorId)

        if (profileIndicator?.role === 'indicator') {
          timeLine[0].descriptionTL = `Lead indicator por ${profileIndicator.user.name}`
          data = { ...data, indicatorId }
        } else {
          throw new IndicatorNotFoundError()
        }
      }
    } else {
      if (profile.role === 'indicator') {
        timeLine[0].descriptionTL = `Lead indicator por ${profile.user.name}`
        data = { ...data, indicatorId: profile.id }
      } else {
        throw new NeedIndicatorField()
      }
    }

    if (consultantId) {
      const profileConsultant =
        await this.profileRepository.findById(consultantId)

      if (profileConsultant?.role) {
        if (profile.role === 'administrator') {
          timeLine = [
            ...timeLine,
            {
              descriptionTL: `O consultant: ${profileConsultant.user.name} join em contact com o lead: ${name}`,
              statusTL: 'get',
            },
          ]
          data = { ...data, consultantId }
        } else {
          throw new SetConsultantNotPermitError()
        }
      } else {
        throw new SetConsultantNotPermitError()
      }
    }

    const leads = await this.leadsRepository.create({
      name,
      phone,
      document,
      email,
      city,
      ...data,
    })

    return { leads }
  }
}
