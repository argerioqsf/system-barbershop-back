import { ServiceRepository } from '@/repositories/service-repository'
import { Service, Prisma } from '@prisma/client'

interface UpdateServiceRequest {
  id: string
  data: Prisma.ServiceUpdateInput
}

interface UpdateServiceResponse {
  service: Service
}

export class UpdateServiceService {
  constructor(private repository: ServiceRepository) {}

  // TODO: verificar qual o inpacto de deletar um serviço nos outros fluxos do sistema
  async execute({
    id,
    data,
  }: UpdateServiceRequest): Promise<UpdateServiceResponse> {
    const service = await this.repository.update(id, data)
    return { service }
  }
}
