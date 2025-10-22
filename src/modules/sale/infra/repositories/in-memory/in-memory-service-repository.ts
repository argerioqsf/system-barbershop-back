// MIGRATION-TODO: mover adaptador para o módulo Catalog quando for migrado.
import { InMemoryServiceRepository as BaseInMemoryServiceRepository } from '@/repositories/in-memory/in-memory-service-repository'

export class InMemoryServiceRepository extends BaseInMemoryServiceRepository {}
