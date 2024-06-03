import { ExtractProfile, Prisma } from '@prisma/client'

export interface ExtractProfileRepository {
  create(
    data: Prisma.ExtractProfileUncheckedCreateInput,
  ): Promise<ExtractProfile>
}
