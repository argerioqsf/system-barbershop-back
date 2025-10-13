import { ServiceRepository } from '@/repositories/service-repository'
import { Service } from '@prisma/client'

interface GetServiceRequest {
  id: string
}

interface GetServiceResponse {
  service: Service | null
}

export class GetServiceService {
  constructor(private repository: ServiceRepository) {}

  async execute({ id }: GetServiceRequest): Promise<GetServiceResponse> {
    const service = await this.repository.findById(id)
    return { service }
  }
}
