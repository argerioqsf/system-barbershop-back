import { SaleRepository } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { PaymentMethod, Sale } from '@prisma/client'

interface CreateSaleItem {
  serviceId: string
  quantity: number
}

interface CreateSaleRequest {
  userId: string
  method: PaymentMethod
  items: CreateSaleItem[]
}

interface CreateSaleResponse {
  sale: Sale
}

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private serviceRepository: ServiceRepository,
  ) {}

  async execute({ userId, method, items }: CreateSaleRequest): Promise<CreateSaleResponse> {
    let total = 0
    const saleItems = [] as any[]

    for (const item of items) {
      const service = await this.serviceRepository.findById(item.serviceId)
      if (!service) throw new Error('Service not found')
      const subtotal = service.price * item.quantity
      total += subtotal
      saleItems.push({ service: { connect: { id: item.serviceId } }, quantity: item.quantity })
    }

    const sale = await this.saleRepository.create({
      total,
      method,
      user: { connect: { id: userId } },
      items: { create: saleItems },
    })

    return { sale }
  }
}
