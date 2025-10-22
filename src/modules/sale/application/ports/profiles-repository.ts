// MIGRATION-TODO: substituir pelo repositório do módulo Organization/IAM quando migrado.
import type {
  ProfilesRepository as BaseProfilesRepository,
  ResponseFindByUserId,
} from '@/repositories/profiles-repository'

export type ProfilesRepository = BaseProfilesRepository

export type { ResponseFindByUserId }
