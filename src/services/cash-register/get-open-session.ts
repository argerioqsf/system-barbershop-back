import {
  CashRegisterRepository,
  ResponseFindOpenByUnit,
} from '@/repositories/cash-register-repository'

interface GetOpenSessionRequest {
  unitId: string
}

interface GetOpenSessionResponse {
  session: ResponseFindOpenByUnit
}

export class GetOpenSessionService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({
    unitId,
  }: GetOpenSessionRequest): Promise<GetOpenSessionResponse> {
    const session = await this.repository.findOpenByUnit(unitId)
    return { session }
  }
}
