// MIGRATION-TODO: substituir pelo repositório do módulo Organization/IAM quando migrado.
import type {
  BarberUsersRepository as BaseBarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'

export type BarberUsersRepository = BaseBarberUsersRepository

export type { UserFindById }
