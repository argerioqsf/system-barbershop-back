import { SaleRepository } from '@/repositories/sale-repository'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

export interface SyncAppointmentSaleInput {
  appointmentId: string
  barberId: string
  clientId: string
  unitId: string
  createdByUserId: string
  price: number
}

export class SyncAppointmentSaleService {
  constructor(private readonly saleRepository: SaleRepository) {}

  async createSale({
    appointmentId,
    barberId,
    clientId,
    unitId,
    createdByUserId,
    price,
  }: SyncAppointmentSaleInput): Promise<void> {
    await this.saleRepository.create({
      total: price,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      user: { connect: { id: createdByUserId } },
      client: { connect: { id: clientId } },
      unit: { connect: { id: unitId } },
      items: {
        create: [
          {
            appointment: { connect: { id: appointmentId } },
            barber: { connect: { id: barberId } },
            quantity: 1,
            price,
          },
        ],
      },
    })
  }
}
