// MIGRATION-TODO: mover adaptador para o módulo Catalog quando for migrado.
import { PrismaCouponRepository as BasePrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'

export class PrismaCouponRepository extends BasePrismaCouponRepository {}
