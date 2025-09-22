import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  UpdateSaleUseCase,
  TransactionRunner,
} from '../../../src/modules/sale/application/use-cases/update-sale'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'
import { PaymentMethod } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'

describe('Update sale use case', () => {
  let repo: FakeSaleRepository
  let useCase: UpdateSaleUseCase
  let runInTransaction: TransactionRunner

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(makeSale('sale-up-1'))

    runInTransaction = vi.fn(async (fn) => fn({} as any))
    useCase = new UpdateSaleUseCase(repo, runInTransaction)

    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))
  })

  it('updates sale method and observation', async () => {
    const result = await useCase.execute({
      id: 'sale-up-1',
      method: PaymentMethod.PIX,
      observation: 'new',
    })

    expect(result.sale?.method).toBe(PaymentMethod.PIX)
    expect(result.sale?.observation).toBe('new')
    expect(runInTransaction).toHaveBeenCalledOnce()
  })

  it('throws when sale already paid', async () => {
    repo.sales[0].paymentStatus = 'PAID'

    await expect(useCase.execute({ id: 'sale-up-1' })).rejects.toThrow(
      'Cannot edit a paid sale',
    )
  })
})
