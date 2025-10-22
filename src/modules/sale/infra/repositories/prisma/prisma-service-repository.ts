// MIGRATION-TODO: mover adaptador para o módulo Catalog quando for migrado.
import { PrismaServiceRepository as BasePrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'

export class PrismaServiceRepository extends BasePrismaServiceRepository {}
