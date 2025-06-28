import { Prisma, LoanRequest } from '@prisma/client'

export interface LoanRequestRepository {
  create(data: Prisma.LoanRequestUncheckedCreateInput): Promise<LoanRequest>
  findMany(where?: Prisma.LoanRequestWhereInput): Promise<LoanRequest[]>
  findById(id: string): Promise<LoanRequest | null>
  update(id: string, data: Prisma.LoanRequestUpdateInput): Promise<LoanRequest>
}
