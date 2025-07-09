import { ServiceRepository } from '@/repositories/service-repository'
import { Service } from '@prisma/client'

interface CreateServiceRequest {
  name: string
  description?: string | null
  imageUrl?: string | null
  cost: number
  price: number
  categoryId?: string | null
  defaultTime?: number | null
  commissionPercentage?: number | null
  unitId: string
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
      ...(data.categoryId && {
        category: { connect: { id: data.categoryId } },
      }),
      defaultTime: data.defaultTime ?? null,
      commissionPercentage: data.commissionPercentage ?? null,
      unit: { connect: { id: data.unitId } },
    })
    return { service }
  }
}
