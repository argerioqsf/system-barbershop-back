import { CreateAppointmentUseCase } from '@/modules/appointment/application/use-cases/create-appointment'
import { CheckBarberAvailabilityService } from '@/modules/appointment/application/services/check-barber-availability-service'
import { SyncAppointmentSaleService } from '@/modules/appointment/application/services/sync-appointment-sale-service'
import { ValidateAppointmentWindowService } from '@/modules/appointment/application/services/validate-appointment-window-service'
import { makeAppointmentTelemetry } from '@/modules/appointment/infra/factories/make-appointment-telemetry'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'

export function makeCreateAppointment() {
  const appointmentRepository = new PrismaAppointmentRepository()
  const serviceRepository = new PrismaServiceRepository()
  const barberUsersRepository = new PrismaBarberUsersRepository()
  const saleRepository = new PrismaSaleRepository()
  const unitRepository = new PrismaUnitRepository()

  const validateAppointmentWindow = new ValidateAppointmentWindowService(
    unitRepository,
  )
  const checkBarberAvailability = new CheckBarberAvailabilityService(
    appointmentRepository,
  )
  const syncAppointmentSaleService = new SyncAppointmentSaleService(
    saleRepository,
  )
  const telemetry = makeAppointmentTelemetry()

  return new CreateAppointmentUseCase(
    appointmentRepository,
    serviceRepository,
    barberUsersRepository,
    validateAppointmentWindow,
    checkBarberAvailability,
    syncAppointmentSaleService,
    telemetry,
  )
}
