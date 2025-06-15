import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { GetProductService } from '@/services/product/get-product'

export function makeGetProductService() {
  return new GetProductService(new PrismaProductRepository())
}
