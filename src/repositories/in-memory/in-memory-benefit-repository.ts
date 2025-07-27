import { Prisma, Benefit, DiscountType } from '@prisma/client'
import { randomUUID } from 'crypto'
import { BenefitRepository } from '../benefit-repository'

export class InMemoryBenefitRepository implements BenefitRepository {
  constructor(public benefits: Benefit[] = []) {}

  async create(data: Prisma.BenefitCreateInput): Promise<Benefit> {
    const benefit: Benefit = {
      id: randomUUID(),
      name: data.name,
      description: (data.description as string | null) ?? null,
      discount: data.discount as number,
      discountType: data.discountType as DiscountType,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.benefits.push(benefit)
    return benefit
  }

  async update(
    id: string,
    data: Prisma.BenefitUpdateInput,
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<Benefit> {
    const benefit = this.benefits.find((b) => b.id === id)
    if (!benefit) throw new Error('Benefit not found')
    if (data.name) benefit.name = data.name as string
    if ('description' in data)
      benefit.description = data.description as string | null
    if ('discount' in data) benefit.discount = data.discount as number
    if ('discountType' in data)
      benefit.discountType = data.discountType as DiscountType
    if (data.unit && 'connect' in data.unit) {
      benefit.unitId = (data.unit as { connect: { id: string } }).connect.id
    }
    return benefit
  }

  async findById(id: string): Promise<Benefit | null> {
    return this.benefits.find((b) => b.id === id) ?? null
  }

  async findMany(where: Prisma.BenefitWhereInput = {}): Promise<Benefit[]> {
    return this.benefits.filter((b) => {
      if (where.name && b.name !== where.name) return false
      if (where.unitId && b.unitId !== where.unitId) return false
      return true
    })
  }

  async delete(id: string): Promise<void> {
    this.benefits = this.benefits.filter((b) => b.id !== id)
  }
}
