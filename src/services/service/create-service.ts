import { ServiceRepository } from '@/repositories/service-repository'
import { Service } from '@prisma/client'

interface CreateServiceRequest {
  name: string
  description?: string | null
  imageUrl?: string | null
  cost: number
  price: number
  isProduct?: boolean
}

interface CreateServiceResponse {
  service: Service
}

export class CreateServiceService {
  constructor(private repository: ServiceRepository) {}

  async execute(data: CreateServiceRequest): Promise<CreateServiceResponse> {
    const service = await this.repository.create({
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      cost: data.cost,
      price: data.price,
      isProduct: data.isProduct ?? false,
    })
    return { service }
  }
}
