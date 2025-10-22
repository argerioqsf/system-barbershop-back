// MIGRATION-TODO: mover adaptador para o módulo Organization/IAM quando for migrado.
import { PrismaProfilesRepository as BasePrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'

export class PrismaProfilesRepository extends BasePrismaProfilesRepository {}
