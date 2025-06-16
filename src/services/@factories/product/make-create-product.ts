import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { CreateProductService } from '@/services/product/create-product'

export function makeCreateProductService() {
  return new CreateProductService(new PrismaProductRepository())
}
