import { UpdateSaleItemCouponInput } from '../use-cases/update-sale-item-coupon'
import { UpdateSaleItemBarberInput } from '../use-cases/update-sale-item-barber'
import { UpdateSaleItemQuantityInput } from '../use-cases/update-sale-item-quantity'
import { UpdateSaleItemCustomPriceInput } from '../use-cases/update-sale-item-custom-price'
import { UpdateSaleItemDetailsInput } from '../use-cases/update-sale-item-details'
import { SaleItemUpdateExecutorResult } from '../services/sale-item-update-executor'

export interface SaleItemCoordinator {
  updateCoupon(
    input: UpdateSaleItemCouponInput,
  ): Promise<SaleItemUpdateExecutorResult>
  updateBarber(
    input: UpdateSaleItemBarberInput,
  ): Promise<SaleItemUpdateExecutorResult>
  updateQuantity(
    input: UpdateSaleItemQuantityInput,
  ): Promise<SaleItemUpdateExecutorResult>
  updateCustomPrice(
    input: UpdateSaleItemCustomPriceInput,
  ): Promise<SaleItemUpdateExecutorResult>
  updateDetails(
    input: UpdateSaleItemDetailsInput,
  ): Promise<SaleItemUpdateExecutorResult>
}
