import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface GetLeadsArchivedServiceRequest {
  page: number
  query?: string
  indicatorId?: string
  consultantId?: string
}

interface GetLeadsArchivedServiceResponse {
  leads: Leads[]
  count: number
}

export class GetLeadsArchivedService {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({
    page,
    query,
    indicatorId,
    consultantId,
  }: GetLeadsArchivedServiceRequest): Promise<GetLeadsArchivedServiceResponse> {
    const leads = await this.leadsRepository.findManyArchived(
      page,
      query,
      indicatorId,
      consultantId,
    )
    const count = await this.leadsRepository.count(query)

    return { leads, count }
  }
}
