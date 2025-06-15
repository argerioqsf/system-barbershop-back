import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { DeleteProductService } from '@/services/product/delete-product'

export function makeDeleteProductService() {
  return new DeleteProductService(new PrismaProductRepository())
}
