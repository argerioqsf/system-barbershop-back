import {
  DetailedSaleItem,
  SaleRepository,
} from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  BarberService,
  PaymentStatus,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  Unit,
  User,
} from '@prisma/client'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { distributeProfits } from './utils/profit-distribution'
import { calculateBarberCommission } from './utils/barber-commission'
import { SetSaleStatusRequest, SetSaleStatusResponse } from './types'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'

type FullUser =
  | (User & {
      profile:
        | (Profile & {
            role: Role
            permissions: Permission[]
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
          })
        | null
      unit: Unit | null
    })
  | null
export class SetSaleStatusService {
  constructor(
    private saleRepository: SaleRepository,
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
    private appointmentRepository: AppointmentRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
  ) {}

  private async verifyCommissionUser(
    item: DetailedSaleItem,
    barber: FullUser,
  ): Promise<number | undefined> {
    let commission: number | undefined
    if (!barber?.profile) throw new ProfileNotFoundError()
    if (item.appointmentId && item.appointment) {
      const first = (item.appointment as any).services?.[0]
      const svcId = item.serviceId ?? first?.service?.id
      if (svcId) {
        const relation =
          await this.barberServiceRepository.findByProfileService(
            barber.profile.id,
            svcId,
          )
        const svc = item.service ?? first?.service
        commission = calculateBarberCommission(svc!, barber.profile, relation)
      }
    } else if (item.serviceId && item.service) {
      const relation = await this.barberServiceRepository.findByProfileService(
        barber.profile.id,
        item.serviceId,
      )
      commission = calculateBarberCommission(
        item.service,
        barber.profile,
        relation,
      )
    } else if (item.productId && item.product) {
      const relation = await this.barberProductRepository.findByProfileProduct(
        barber.profile.id,
        item.productId,
      )
      commission = calculateBarberCommission(
        item.product,
        barber.profile,
        relation,
      )
    }
    return commission
  }

  async execute({
    saleId,
    userId,
    paymentStatus,
  }: SetSaleStatusRequest): Promise<SetSaleStatusResponse> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) throw new SaleNotFoundError()

    if (sale.paymentStatus === paymentStatus) {
      return { sale }
    }

    if (paymentStatus === PaymentStatus.PAID) {
      const user = await this.barberUserRepository.findById(userId)
      const session = await this.cashRegisterRepository.findOpenByUnit(
        user?.unitId as string,
      )
      if (!session) throw new CashRegisterClosedError()

      for (const item of sale.items) {
        let barberId = item.barberId
        if (item.appointment) {
          barberId = item.appointment.barberId
        }
        if (!barberId) continue
        const barber = await this.barberUserRepository.findById(barberId)
        if (!barber?.profile) throw new ProfileNotFoundError()

        const commission: number | undefined = await this.verifyCommissionUser(
          item,
          barber,
        )

        if (commission !== undefined) {
          item.porcentagemBarbeiro = commission
        }
      }

      const updatedSale = await this.saleRepository.update(saleId, {
        paymentStatus,
        session: { connect: { id: session.id } },
      })

      for (const item of updatedSale.items) {
        if (item.appointmentId) {
          await this.appointmentRepository.update(item.appointmentId, {
            status: 'CONCLUDED',
          })
        }
      }

      const { transactions } = await distributeProfits(
        updatedSale,
        user?.organizationId as string,
        userId,
        {
          organizationRepository: this.organizationRepository,
          profileRepository: this.profileRepository,
          unitRepository: this.unitRepository,
          transactionRepository: this.transactionRepository,
        },
      )

      updatedSale.transactions = [...transactions]

      return { sale: updatedSale }
    }

    const updatedSale = await this.saleRepository.update(saleId, {
      paymentStatus,
    })
    return { sale: updatedSale }
  }
}
