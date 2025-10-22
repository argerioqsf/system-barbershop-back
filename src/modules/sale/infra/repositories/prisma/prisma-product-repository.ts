// MIGRATION-TODO: mover adaptador para o módulo Catalog quando ele for criado.
import { PrismaProductRepository as BasePrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'

export class PrismaProductRepository extends BasePrismaProductRepository {}
