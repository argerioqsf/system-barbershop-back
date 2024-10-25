import { ExtractProfile, Prisma } from '@prisma/client'

export interface ExtractProfileRepository {
  create(
    data: Prisma.ExtractProfileUncheckedCreateInput,
  ): Promise<ExtractProfile>
  addAmountReceive(
    where: Prisma.ExtractProfileWhereInput,
  ): Promise<{ _sum: { amount_receive: number | null } }>
}
