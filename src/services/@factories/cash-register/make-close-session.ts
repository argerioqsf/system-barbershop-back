import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { CloseSessionService } from '@/services/cash-register/close-session'

export function makeCloseSessionService() {
  return new CloseSessionService(new PrismaCashRegisterRepository())
}
