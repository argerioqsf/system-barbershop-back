import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { ListSessionsService } from '@/services/cash-register/list-sessions'

export function makeListSessionsService() {
  return new ListSessionsService(new PrismaCashRegisterRepository())
}
