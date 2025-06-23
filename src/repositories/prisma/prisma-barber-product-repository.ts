import { prisma } from '@/lib/prisma'
import { Prisma, BarberProduct } from '@prisma/client'
import { BarberProductRepository } from '../barber-product-repository'

export class PrismaBarberProductRepository implements BarberProductRepository {
  async create(
    data: Prisma.BarberProductUncheckedCreateInput,
  ): Promise<BarberProduct> {
    return prisma.barberProduct.create({ data })
  }

  async findByProfileProduct(
    profileId: string,
    productId: string,
  ): Promise<BarberProduct | null> {
    return prisma.barberProduct.findUnique({
      where: { profileId_productId: { profileId, productId } },
    })
  }
}
