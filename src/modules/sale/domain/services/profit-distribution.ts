import { Money } from '@/core/domain/value-objects/money'
import { Percentage } from '@/core/domain/value-objects/percentage'
import { DetailedSale, DetailedSaleItem } from '@/repositories/sale-repository'
import { BarberProduct, BarberService } from '@prisma/client'

// Define a more specific type for the items the service will receive
// The application layer is responsible for adding the 'relation' property.

// 1. Define the type for a single service within an appointment, including the optional relation
type AppointmentServiceForDistribution = NonNullable<
  NonNullable<DetailedSaleItem['appointment']>['services']
>[number] & { relation?: BarberService | BarberProduct | null }

// 2. Define the SaleItem type for distribution, using the new appointment service type
export type SaleItemForDistribution = DetailedSaleItem & {
  relation?: BarberService | BarberProduct | null
  appointment?: {
    services?: AppointmentServiceForDistribution[]
  } | null
}

// 3. Define the Sale type for distribution
export type SaleForDistribution = Omit<DetailedSale, 'items'> & {
  items: SaleItemForDistribution[]
}

export type BarberShare = {
  barberId: string
  amount: Money
  saleItemId: string
  commissionPercentage: Percentage
  appointmentServiceId?: string
}

export type DistributeSaleProfitsOutput = {
  ownerShare: Money
  barberShares: BarberShare[]
}

function getBarberCommissionPercentage(
  item: SaleItemForDistribution,
  relation: BarberService | BarberProduct | null,
): Percentage {
  const source = item.service ?? item.product
  if (!source || !item.barber || !item.barber.profile) {
    return Percentage.from(0)
  }

  if (relation && relation.commissionPercentage) {
    return Percentage.from(relation.commissionPercentage)
  }

  if (item.barber.profile.commissionPercentage) {
    return Percentage.from(item.barber.profile.commissionPercentage)
  }

  if (source.commissionPercentage) {
    return Percentage.from(source.commissionPercentage)
  }

  return Percentage.from(0)
}

export class ProfitDistributionService {
  execute(sale: SaleForDistribution): DistributeSaleProfitsOutput {
    let ownerShare = Money.zero()
    const barberShares: BarberShare[] = []

    for (const item of sale.items) {
      const discounts =
        item.discounts?.map((d) => ({
          amount: d.amount,
          type: d.type,
          order: d.order,
        })) ?? []
      const itemPrice = Money.from(item.price)

      const netItemPrice = discounts
        .sort((a, b) => a.order - b.order)
        .reduce((acc, discount) => {
          if (discount.type === 'VALUE') {
            return acc.subtract(Money.from(discount.amount))
          }
          if (discount.type === 'PERCENTAGE') {
            const discountValue = acc.percentage(
              Percentage.from(discount.amount),
            )
            return acc.subtract(discountValue)
          }
          return acc
        }, itemPrice)
        .clampZero()

      if (
        !item.barberId ||
        !item.barber ||
        !item.barber.profile ||
        item.planId
      ) {
        ownerShare = ownerShare.add(netItemPrice)
        continue
      }

      const relation = item.relation ?? null

      if (item.appointmentId && item.appointment) {
        const servicesInAppointment = item.appointment.services ?? []
        let totalCommissionForAppointmentItem = Money.zero()

        for (const serviceAppoint of servicesInAppointment) {
          const servicePrice = Money.from(serviceAppoint.service.price)
          const serviceRelation = serviceAppoint.relation ?? null

          const commissionPercentage = getBarberCommissionPercentage(
            item,
            serviceRelation,
          )

          const barberValue = servicePrice.percentage(commissionPercentage)
          totalCommissionForAppointmentItem =
            totalCommissionForAppointmentItem.add(barberValue)

          barberShares.push({
            barberId: item.barber.id,
            amount: barberValue,
            saleItemId: item.id,
            commissionPercentage,
            appointmentServiceId: serviceAppoint.id,
          })
        }

        const ownerValue = netItemPrice
          .subtract(totalCommissionForAppointmentItem)
          .clampZero()
        ownerShare = ownerShare.add(ownerValue)
        continue
      }

      const commissionPercentage = getBarberCommissionPercentage(item, relation)

      const barberValue = netItemPrice.percentage(commissionPercentage)

      barberShares.push({
        barberId: item.barberId,
        amount: barberValue,
        saleItemId: item.id,
        commissionPercentage,
      })

      const ownerValue = netItemPrice.subtract(barberValue)
      ownerShare = ownerShare.add(ownerValue)
    }

    return {
      ownerShare,
      barberShares,
    }
  }
}
