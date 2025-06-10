import { ServiceRepository } from '@/repositories/service-repository'
import { Service } from '@prisma/client'

interface ListServicesResponse {
  services: Service[]
}

export class ListServicesService {
  constructor(private repository: ServiceRepository) {}

  async execute(): Promise<ListServicesResponse> {
    const services = await this.repository.findMany()
    return { services }
  }
}
