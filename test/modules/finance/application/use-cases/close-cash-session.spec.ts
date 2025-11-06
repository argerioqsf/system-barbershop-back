import { describe, it, expect, beforeEach } from 'vitest'
import { CloseCashSessionUseCase } from '../../../../../src/modules/finance/application/use-cases/close-cash-session'
import { InMemoryCashRegisterRepositoryAdapter } from '../../../../../src/modules/finance/infra/repositories/in-memory/in-memory-cash-register-repository'
import { FakeSaleRepository } from '../../../../helpers/fake-repositories'
import { defaultSale } from '../../../../helpers/default-values'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import { TransactionRunner } from '../../../../../src/core/application/ports/transaction-runner'
import { CashRegisterHasPendingSalesError } from '../../../../../src/services/@errors/cash-register/cash-register-has-pending-sales-error'
import { CashRegisterNotOpenedError } from '../../../../../src/modules/finance/application/errors/cash-register-not-opened-error'

describe('CloseCashSessionUseCase', () => {
  let cashRegisterRepository: InMemoryCashRegisterRepositoryAdapter
  let saleRepository: FakeSaleRepository
  let useCase: CloseCashSessionUseCase

  const runner: TransactionRunner = {
    run: async (fn) => fn(undefined as never),
  }

  beforeEach(() => {
    cashRegisterRepository = new InMemoryCashRegisterRepositoryAdapter()
    saleRepository = new FakeSaleRepository()
    useCase = new CloseCashSessionUseCase(
      cashRegisterRepository,
      saleRepository,
      runner,
    )
  })

  it('fecha a sessão aberta quando não há vendas pendentes', async () => {
    const session = await cashRegisterRepository.create({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openingAmount: Money.from(100),
    })

    const result = await useCase.execute({ unitId: session.unitId })

    expect(result.session.id).toBe(session.id)
    expect(result.session.closedAt).not.toBeNull()
    expect(result.session.finalAmount).toBe(100)

    const stillOpen = await cashRegisterRepository.findOpenByUnit('unit-1')
    expect(stillOpen).toBeNull()
  })

  it('lança erro quando não existe sessão aberta', async () => {
    await expect(useCase.execute({ unitId: 'unit-1' })).rejects.toThrow(
      CashRegisterNotOpenedError,
    )
  })

  it('impede fechar sessão com vendas pendentes', async () => {
    await cashRegisterRepository.create({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openingAmount: Money.from(50),
    })

    saleRepository.sales.push({
      ...defaultSale,
      id: 'sale-1',
      unitId: 'unit-1',
      status: 'IN_PROGRESS',
      createdAt: new Date(),
    })

    await expect(useCase.execute({ unitId: 'unit-1' })).rejects.toThrow(
      CashRegisterHasPendingSalesError,
    )
  })
})
