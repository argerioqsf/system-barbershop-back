import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface UpdateLeadArchivedServiceRequest {
  id: string
  archived: boolean
}

interface UpdateLeadArchivedServiceResponse {
  lead: Leads
}

export class UpdateLeadArchivedService {
  constructor(private leadRepository: LeadsRepository) {}

  async execute({
    id,
    archived,
  }: UpdateLeadArchivedServiceRequest): Promise<UpdateLeadArchivedServiceResponse> {
    const lead = await this.leadRepository.updateById(id, {
      id,
      archived,
    })

    return {
      lead,
    }
  }
}
