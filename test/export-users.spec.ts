import { describe, it, expect, beforeEach } from 'vitest'
import { ExportUsersService } from '../src/services/config/export-users'
import { FakeBarberUsersRepository } from './helpers/fake-repositories'
import { defaultUser } from './helpers/default-values'

describe('Export users service', () => {
  let repo: FakeBarberUsersRepository
  let service: ExportUsersService

  beforeEach(() => {
    repo = new FakeBarberUsersRepository([{ ...defaultUser, profile: null, unit: null }])
    service = new ExportUsersService(repo)
  })

  it('returns all users', async () => {
    const res = await service.execute()
    expect(res.users).toHaveLength(1)
  })
})
