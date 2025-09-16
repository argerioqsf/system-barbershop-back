import { SaleRepository } from '../../repositories/sale-repository'
import { PaymentMethod, PaymentStatus, PermissionName } from '@prisma/client'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CreateSaleRequest, CreateSaleResponse } from './types'
import { assertPermission } from '@/utils/permissions'

export class CreateSaleService {
  constructor(
    private saleRepository: SaleRepository,
    private barberUserRepository: BarberUsersRepository,
  ) {}

  async execute({
    userId,
    method,
    clientId,
    observation,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const user = await this.barberUserRepository.findById(userId)
    await assertPermission(
      [PermissionName.CREATE_SALE],
      user?.profile?.permissions?.map((p) => p.name),
    )

    const sale = await this.saleRepository.create({
      total: 0,
      // TODO: nao receber mais esse campo method aqui, deixar para setar esse campo apenas no service de pagar a sale
      method: method ?? PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      user: { connect: { id: userId } },
      client: { connect: { id: clientId } },
      unit: { connect: { id: user?.unitId } },
      observation,
    })

    return { sale }
  }
}
