import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface UpdateLeadServiceRequest {
  id: string
  name: string
  phone: string
  document: string
  email: string
  city: string
  consultantId?: string | null
  unitId?: string
}

interface UpdateLeadServiceResponse {
  lead: Leads
}

export class UpdateLeadService {
  constructor(private leadRepository: LeadsRepository) {}

  async execute({
    id,
    name,
    email,
    document,
    phone,
    city,
    consultantId,
    unitId,
  }: UpdateLeadServiceRequest): Promise<UpdateLeadServiceResponse> {
    const lead = await this.leadRepository.updateById(id, {
      id,
      name,
      city,
      document,
      email,
      phone,
      consultantId,
      unitId,
    })

    return {
      lead,
    }
  }
}
