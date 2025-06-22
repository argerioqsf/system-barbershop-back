import { BarberProductRepository } from '../barber-product-repository'
import { BarberProduct, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

export class InMemoryBarberProductRepository
  implements BarberProductRepository
{
  constructor(public items: BarberProduct[] = []) {}

  async create(
    data: Prisma.BarberProductUncheckedCreateInput,
  ): Promise<BarberProduct> {
    const item: BarberProduct = {
      id: randomUUID(),
      profileId: data.profileId,
      productId: data.productId,
      commissionPercentage: data.commissionPercentage ?? null,
      commissionType: data.commissionType ?? 'PERCENTAGE_OF_SERVICE',
    }
    this.items.push(item)
    return item
  }

  async findByProfileProduct(
    profileId: string,
    productId: string,
  ): Promise<BarberProduct | null> {
    return (
      this.items.find(
        (i) => i.profileId === profileId && i.productId === productId,
      ) ?? null
    )
  }
}
