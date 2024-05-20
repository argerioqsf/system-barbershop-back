import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'

interface CreateLeadPublicServiceRequest {
  name: string
  phone: string
  document: string
  email: string
  city: string
  indicatorId: string
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
  }: CreateLeadPublicServiceRequest): Promise<CreateLeadPublicServiceResponse> {
    const leads = await this.leadsRepository.create({
      name,
      phone,
      document,
      email,
      city,
      indicatorId,
    })

    return { leads }
  }
}
