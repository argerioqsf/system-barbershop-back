import { ServiceRepository } from '@/repositories/service-repository'
import { Service } from '@prisma/client'

interface ListServicesResponse {
  services: Service[]
}

export class ListServicesService {
  constructor(private repository: ServiceRepository) {}

  async execute(unitId: string): Promise<ListServicesResponse> {
    const services = await this.repository.findManyByUnit(unitId)
    return { services }
  }
}
