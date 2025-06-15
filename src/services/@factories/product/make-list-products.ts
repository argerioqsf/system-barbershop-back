import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { ListProductsService } from '@/services/product/list-products'

export function makeListProductsService() {
  return new ListProductsService(new PrismaProductRepository())
}
