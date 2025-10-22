// MIGRATION-TODO: mover adaptador para o módulo Organization/IAM quando for migrado.
import { InMemoryBarberUsersRepository as BaseInMemoryBarberUsersRepository } from '@/repositories/in-memory/in-memory-barber-users-repository'

export class InMemoryBarberUsersRepository extends BaseInMemoryBarberUsersRepository {}
