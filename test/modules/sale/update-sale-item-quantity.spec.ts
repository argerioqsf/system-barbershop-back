import { describe, expect, it, vi } from 'vitest'
import { UpdateSaleItemQuantityUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-quantity'
import { SaleItemUpdateExecutor } from '../../../src/modules/sale/application/services/sale-item-update-executor'
import { ProductRepository } from '../../../src/repositories/product-repository'

const makeExecutor = () => {
  const execute = vi.fn().mockResolvedValue({ sale: null, saleItems: [] })
  return {
    instance: { execute } as unknown as SaleItemUpdateExecutor,
    execute,
  }
}

const makeProductRepository = () => {
  return {
    findById: vi.fn().mockResolvedValue({ id: 'product-01', quantity: 10 }),
    update: vi.fn(),
  } as unknown as ProductRepository
}

describe('UpdateSaleItemQuantityUseCase', () => {
  it('rejects zero quantity', async () => {
    const { instance } = makeExecutor()
    const repo = makeProductRepository()
    const useCase = new UpdateSaleItemQuantityUseCase(instance, repo)

    await expect(
      useCase.execute({ saleItemId: 'item-01', quantity: 0 }),
    ).rejects.toThrow('Sale item quantity must be greater than zero')
  })

  it('delegates to executor when quantity is valid', async () => {
    const { instance, execute } = makeExecutor()
    const repo = makeProductRepository()
    const useCase = new UpdateSaleItemQuantityUseCase(instance, repo)

    await useCase.execute({ saleItemId: 'item-01', quantity: 2 })

    expect(execute).toHaveBeenCalledWith({
      saleItemId: 'item-01',
      patch: { quantity: 2 },
      hooks: expect.any(Object),
    })
  })
})
