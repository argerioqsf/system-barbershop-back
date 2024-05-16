import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface GetLeadsServiceRequest {
  page: number
  query?: string
  indicatorId?: string
  consultantId?: string
}

interface GetLeadsServiceResponse {
  leads: Leads[]
  count: number
}

export class GetLeadsService {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({
    page,
    query,
    indicatorId,
    consultantId,
  }: GetLeadsServiceRequest): Promise<GetLeadsServiceResponse> {
    const leads = await this.leadsRepository.findMany(
      page,
      query,
      indicatorId,
      consultantId,
    )
    const count = await this.leadsRepository.count(query)

    return { leads, count }
  }
}
