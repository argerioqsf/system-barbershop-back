import { LeadsRepository } from '@/repositories/leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { Leads } from '@prisma/client'
import { AdministratorCreateIndicatorNotFound } from '../@errors/administrator-create-indicator-not-found'
import { IndicatorNotFoundError } from '../@errors/indicator-not-found-error'
import { NeedIndicatorField } from '../@errors/need-indicator-field'
import { SetConsultantNotPermitError } from '../@errors/set-consultant-not-permission'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface CreateLeadsServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId?: string
  consultantId?: string
  userId: string
  unitId: string
}

interface CreateLeadsServiceResponse {
  leads: Leads
}

export class CreateLeadsService {
  constructor(
    private leadsRepository: LeadsRepository,
    private profileRepository: PrismaProfilesRepository,
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
    unitId,
  }: CreateLeadsServiceRequest): Promise<CreateLeadsServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) throw new UserNotFoundError()

    let data: { indicatorId: string; consultantId?: string } = {
      indicatorId: '',
    }

    if (indicatorId) {
      if (profile.role === 'indicator') {
        throw new AdministratorCreateIndicatorNotFound()
      } else {
        const profileIndicator =
          await this.profileRepository.findById(indicatorId)

        if (profileIndicator?.role === 'indicator') {
          data = { ...data, indicatorId }
        } else {
          throw new IndicatorNotFoundError()
        }
      }
    } else {
      if (profile.role === 'indicator') {
        data = { ...data, indicatorId: profile.id }
      } else {
        throw new NeedIndicatorField()
      }
    }

    if (consultantId) {
      if (profile.role === 'administrator') {
        data = { ...data, consultantId }
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
      unitId,
      ...data,
    })

    return { leads }
  }
}
