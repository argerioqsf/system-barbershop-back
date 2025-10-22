// MIGRATION-TODO: mover adaptador para o módulo Catalog quando for migrado.
import { InMemoryCouponRepository as BaseInMemoryCouponRepository } from '@/repositories/in-memory/in-memory-coupon-repository'

export class InMemoryCouponRepository extends BaseInMemoryCouponRepository {}
