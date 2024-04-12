import { LeadsRepository } from "@/repositories/leads-repository";
import { Leads } from "@prisma/client";

interface CreateLeadsServiceRequest {
  name: string;
  phone: string;
  document: string;
  email: string;
  city: string;
  indicatorId: string;
  consultantId: string;
}

interface CreateLeadsServiceResponse {
  leads: Leads;
}

export class CreateLeadsService {
  constructor(
    private leadsRepository: LeadsRepository,
  ) {}

  async execute({
    name,
    phone,
    document,
    email,
    city,
    indicatorId,
    consultantId,
  }: CreateLeadsServiceRequest): Promise<CreateLeadsServiceResponse> {
    const leads = await this.leadsRepository.create({ name, phone, document, email, city, indicatorId, consultantId });

    return { leads };
  }
}
