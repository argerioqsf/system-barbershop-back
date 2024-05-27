import { LeadsRepository } from '@/repositories/leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { Leads } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface GetLeadsServiceRequest {
  page: number
  query?: string
  indicatorId?: string
  consultantId?: string
  userId: string
}

interface GetLeadsServiceResponse {
  leads: Leads[]
  count: number
}

export class GetLeadsService {
  constructor(
    private leadsRepository: LeadsRepository,
    private profileRepository: PrismaProfilesRepository,
  ) {}

  async execute({
    page,
    query,
    indicatorId,
    consultantId,
    userId,
  }: GetLeadsServiceRequest): Promise<GetLeadsServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) throw new UserNotFoundError()

    let unitsId

    if (profile.role === 'consultant') {
      unitsId = profile.units.map((unit) => unit.unit.id)
    }
    const leads = await this.leadsRepository.findMany(
      page,
      query,
      indicatorId,
      consultantId,
      unitsId,
    )
    const count = await this.leadsRepository.count(query, unitsId)

    return { leads, count }
  }
}
