// MIGRATION-TODO: mover adaptador para o módulo Catalog quando for migrado.
import { InMemoryProductRepository as BaseInMemoryProductRepository } from '@/repositories/in-memory/in-memory-product-repository'

export class InMemoryProductRepository extends BaseInMemoryProductRepository {}
