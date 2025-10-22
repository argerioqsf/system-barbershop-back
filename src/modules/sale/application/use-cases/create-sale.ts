import { PaymentMethod, PaymentStatus, PermissionName } from '@prisma/client'
import { SaleRepository } from '@/modules/sale/application/ports/sale-repository'
import { BarberUsersRepository } from '@/modules/sale/application/ports/barber-users-repository'
import {
  CreateSaleRequest,
  CreateSaleResponse,
} from '@/modules/sale/application/dto/sale'
import { assertPermission } from '@/utils/permissions'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'

export class CreateSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute({
    userId,
    method,
    clientId,
    observation,
  }: CreateSaleRequest): Promise<CreateSaleResponse> {
    const user = await this.barberUsersRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundError()
    }

    const permissions = user.profile?.permissions.map((permission) => {
      return permission.name
    })

    assertPermission([PermissionName.CREATE_SALE], permissions)

    const sale = await this.saleRepository.create({
      total: 0,
      gross_value: 0,
      method: method ?? PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      user: { connect: { id: userId } },
      client: { connect: { id: clientId } },
      unit: { connect: { id: user.unitId } },
      observation,
    })

    await this.telemetry?.record({
      operation: 'sale.created',
      saleId: sale.id,
      actorId: userId,
      metadata: {
        paymentMethod: sale.method,
        clientId,
        unitId: user.unitId,
      },
    })

    return { sale }
  }
}
