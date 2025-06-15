import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { UpdateProductService } from '@/services/product/update-product'

export function makeUpdateProductService() {
  return new UpdateProductService(new PrismaProductRepository())
}
