import { LeadsRepository } from "@/repositories/leads-repository";
import { Leads } from "@prisma/client";

interface GetLeadsServiceRequest {
  page: number;
  query?: string;
}

interface GetLeadsServiceResponse {
  leads: Leads[];
}

export class GetLeadsService {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({ page, query }: GetLeadsServiceRequest): Promise<GetLeadsServiceResponse> {
    const leads = await this.leadsRepository.findMany(page, query);

    return { leads };
  }
}
