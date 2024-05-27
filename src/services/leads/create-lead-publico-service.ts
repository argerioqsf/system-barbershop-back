import { LeadsRepository } from '@/repositories/leads-repository'
import { Leads } from '@prisma/client'
import { LeadsEmailExistsError } from '../@errors/leads-email-exists-error'
import { LeadsDocumentExistsError } from '../@errors/leads-document-exists-error'

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
    const verifyExistEmailLead = await this.leadsRepository.find({
      email,
    })

    if (verifyExistEmailLead.length > 0) throw new LeadsEmailExistsError()

    const verifyExistDocumentLead = await this.leadsRepository.find({
      document,
    })

    if (verifyExistDocumentLead.length > 0) throw new LeadsDocumentExistsError()

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
