// MIGRATION-TODO: mover adaptador para o módulo Organization/IAM quando for migrado.
import { PrismaBarberUsersRepository as BasePrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'

export class PrismaBarberUsersRepository extends BasePrismaBarberUsersRepository {}
