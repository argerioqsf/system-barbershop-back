import { LeadsRepository } from '@/repositories/leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { Leads, Prisma } from '@prisma/client'
import { SetConsultantNotPermitError } from '../@errors/set-consultant-not-permission'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface CreateLeadsServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId: string
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
  ) {}

  async execute({
    name,
    phone,
    document,
    email,
    city,
    indicatorId,
    consultantId,
    userId,
  }: CreateLeadsServiceRequest): Promise<CreateLeadsServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) throw new UserNotFoundError()

    let data: Prisma.LeadsUncheckedCreateInput = {
      name,
      phone,
      document,
      email,
      city,
      indicatorId,
    }

    if (consultantId) {
      if (profile.role === 'administrator') {
        data = { ...data, consultantId }
      } else {
        throw new SetConsultantNotPermitError()
      }
    }

    const leads = await this.leadsRepository.create(data)

    return { leads }
  }
}
