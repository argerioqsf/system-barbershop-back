import { SaleItemUpdateExecutorResult } from '../services/sale-item-update-executor'
import {
  UpdateSaleItemCouponUseCase,
  UpdateSaleItemCouponInput,
} from '../use-cases/update-sale-item-coupon'
import {
  UpdateSaleItemBarberUseCase,
  UpdateSaleItemBarberInput,
} from '../use-cases/update-sale-item-barber'
import {
  UpdateSaleItemQuantityUseCase,
  UpdateSaleItemQuantityInput,
} from '../use-cases/update-sale-item-quantity'
import {
  UpdateSaleItemCustomPriceUseCase,
  UpdateSaleItemCustomPriceInput,
} from '../use-cases/update-sale-item-custom-price'
import {
  UpdateSaleItemDetailsUseCase,
  UpdateSaleItemDetailsInput,
} from '../use-cases/update-sale-item-details'
import { SaleItemCoordinator as SaleItemCoordinatorContract } from '../ports/sale-item-coordinator'

export class SaleItemCoordinator implements SaleItemCoordinatorContract {
  constructor(
    private readonly updateCouponUseCase: UpdateSaleItemCouponUseCase,
    private readonly updateBarberUseCase: UpdateSaleItemBarberUseCase,
    private readonly updateQuantityUseCase: UpdateSaleItemQuantityUseCase,
    private readonly updateCustomPriceUseCase: UpdateSaleItemCustomPriceUseCase,
    private readonly updateDetailsUseCase: UpdateSaleItemDetailsUseCase,
  ) {}

  async updateCoupon(
    input: UpdateSaleItemCouponInput,
  ): Promise<SaleItemUpdateExecutorResult> {
    return this.updateCouponUseCase.execute(input)
  }

  async updateBarber(
    input: UpdateSaleItemBarberInput,
  ): Promise<SaleItemUpdateExecutorResult> {
    return this.updateBarberUseCase.execute(input)
  }

  async updateQuantity(
    input: UpdateSaleItemQuantityInput,
  ): Promise<SaleItemUpdateExecutorResult> {
    return this.updateQuantityUseCase.execute(input)
  }

  async updateCustomPrice(
    input: UpdateSaleItemCustomPriceInput,
  ): Promise<SaleItemUpdateExecutorResult> {
    return this.updateCustomPriceUseCase.execute(input)
  }

  async updateDetails(
    input: UpdateSaleItemDetailsInput,
  ): Promise<SaleItemUpdateExecutorResult> {
    return this.updateDetailsUseCase.execute(input)
  }
}
