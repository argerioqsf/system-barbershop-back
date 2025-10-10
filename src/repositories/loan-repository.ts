import { Prisma, Loan, Transaction } from '@prisma/client'

export type LoanWithTransactions = Loan & { transactions: Transaction[] }

export interface LoanRepository {
  create(data: Prisma.LoanUncheckedCreateInput): Promise<Loan>
  update(
    id: string,
    data: Prisma.LoanUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan>
  findById(id: string): Promise<LoanWithTransactions | null>
  findMany(
    where?: Prisma.LoanWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactions[]>
}
