import { describe, expect, it, vi } from 'vitest'
import { UpdateSaleItemCustomPriceUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-custom-price'
import { SaleItemUpdateExecutor } from '../../../src/modules/sale/application/services/sale-item-update-executor'

const makeExecutor = () => {
  const execute = vi.fn().mockResolvedValue({ sale: null, saleItems: [] })
  return {
    instance: { execute } as unknown as SaleItemUpdateExecutor,
    execute,
  }
}

describe('UpdateSaleItemCustomPriceUseCase', () => {
  it('rejects negative custom price', async () => {
    const { instance } = makeExecutor()
    const useCase = new UpdateSaleItemCustomPriceUseCase(instance)

    await expect(
      useCase.execute({ saleItemId: 'item-01', customPrice: -5 }),
    ).rejects.toThrow(
      'Sale item custom price must be greater than or equal to zero',
    )
  })

  it('delegates to executor', async () => {
    const { instance, execute } = makeExecutor()
    const useCase = new UpdateSaleItemCustomPriceUseCase(instance)

    await useCase.execute({ saleItemId: 'item-01', customPrice: 25 })

    expect(execute).toHaveBeenCalledWith({
      saleItemId: 'item-01',
      patch: { customPrice: 25 },
    })
  })
})
