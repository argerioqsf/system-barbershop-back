import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

interface GetLeadServiceRequest {
  id: string
}

interface GetLeadServiceResponse {
  lead: Leads
}

export class GetLeadService {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({
    id,
  }: GetLeadServiceRequest): Promise<GetLeadServiceResponse> {
    const lead = await this.leadsRepository.findById(id)

    if (!lead) throw new UnitNotFoundError()

    return { lead }
  }
}
