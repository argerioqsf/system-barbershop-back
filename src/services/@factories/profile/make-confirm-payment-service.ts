import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { ConfirmPaymentService } from '@/services/profile/confirm-payment-service'

export function makeConfirmPaymentService() {
  return new ConfirmPaymentService(new PrismaProfilesRepository())
}
