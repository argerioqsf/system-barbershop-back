import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface CreateLeadPublicServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId: string
  unitId: string
}

interface CreateLeadPublicServiceResponse {
  leads: Leads
}

export class CreateLeadPublicService {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({
    name,
    phone,
    document,
    email,
    city,
    indicatorId,
    unitId,
  }: CreateLeadPublicServiceRequest): Promise<CreateLeadPublicServiceResponse> {
    const leads = await this.leadsRepository.create({
      name,
      phone,
      document,
      email,
      city,
      indicatorId,
      unitId,
    })

    return { leads }
  }
}
