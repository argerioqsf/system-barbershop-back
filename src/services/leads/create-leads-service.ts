import { LeadsRepository } from '@/repositories/leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { Leads, Timeline } from '@prisma/client'
import { AdministratorCreateIndicatorNotFound } from '../@errors/administrator-create-indicator-not-found'
import { IndicatorNotFoundError } from '../@errors/indicator-not-found-error'
import { LeadsDocumentExistsError } from '../@errors/leads-document-exists-error'
import { LeadsEmailExistsError } from '../@errors/leads-email-exists-error'
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
  segmentId: string
  courseId: string
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
    segmentId,
    courseId,
  }: CreateLeadsServiceRequest): Promise<CreateLeadsServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) throw new UserNotFoundError()
    const verifyExistEmailLead = await this.leadsRepository.find({
      email,
    })

    if (verifyExistEmailLead.length > 0) throw new LeadsEmailExistsError()

    const verifyExistDocumentLead = await this.leadsRepository.find({
      document,
    })

    if (verifyExistDocumentLead.length > 0) throw new LeadsDocumentExistsError()

    let data: { indicatorId: string; consultantId?: string } = {
      indicatorId: '',
    }

    let timeLine: Omit<Timeline, 'id' | 'leadsId'>[] = [
      {
        description: '',
        status: 'Novo Lead',
        courseId,
        segmentId,
        unitId,
        title: '',
      },
    ]

    if (indicatorId) {
      if (profile.role === 'indicator') {
        throw new AdministratorCreateIndicatorNotFound()
      } else {
        const profileIndicator =
          await this.profileRepository.findById(indicatorId)

        if (profileIndicator?.role === 'indicator') {
          timeLine[0].description = `Lead indicator por ${profileIndicator.user.name}`
          data = { ...data, indicatorId }
        } else {
          throw new IndicatorNotFoundError()
        }
      }
    } else {
      if (profile.role === 'indicator') {
        timeLine[0].description = `Lead indicator por ${profile.user.name}`
        data = { ...data, indicatorId: profile.id }
      } else {
        throw new NeedIndicatorField()
      }
    }

    if (consultantId) {
      const profileConsultant =
        await this.profileRepository.findById(consultantId)
      console.log('profileConsultant', profileConsultant)
      console.log('profile', profile)
      if (profileConsultant?.role === 'consultant') {
        if (profile.role === 'administrator') {
          timeLine = [
            ...timeLine,
            {
              description: `O consultor ${profileConsultant.user.name} entrou em contato com o lead ${name}`,
              status: 'get',
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
    }

    const leads = await this.leadsRepository.create(
      {
        name,
        phone,
        document,
        email,
        city,
        unitId,
        courseId,
        segmentId,
        ...data,
      },
      timeLine,
    )

    return { leads }
  }
}
