import { BarberProduct, Prisma } from '@prisma/client'

export interface BarberProductRepository {
  create(data: Prisma.BarberProductUncheckedCreateInput): Promise<BarberProduct>
  findByProfileProduct(
    profileId: string,
    productId: string,
  ): Promise<BarberProduct | null>
  update(
    profileId: string,
    productId: string,
    data: Prisma.BarberProductUncheckedUpdateInput,
  ): Promise<BarberProduct>
  deleteByProfileProduct(profileId: string, productId: string): Promise<void>
}
