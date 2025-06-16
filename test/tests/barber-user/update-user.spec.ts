import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateUserService } from '../../../src/services/barber-user/update-user'
import { InMemoryBarberUsersRepository, FakeUnitRepository } from '../../helpers/fake-repositories'
import { defaultUnit } from '../../helpers/default-values'
import { makeUser, makeProfile } from '../../factories/make-user.factory'

describe('Update user service', () => {
  let repo: InMemoryBarberUsersRepository
  let unitRepo: FakeUnitRepository
  let service: UpdateUserService
  let stored: any

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    unitRepo = new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }])
    service = new UpdateUserService(repo, unitRepo)
    const user = makeUser()
    const profile = makeProfile({ userId: user.id })
    stored = { ...user, profile }
    repo.users.push(stored)
  })

  it('updates user data', async () => {
    const res = await service.execute({ id: stored.id, name: 'New', phone: '9' })
    expect(res.user.name).toBe('New')
    expect(res.profile?.phone).toBe('9')
  })

  it('updates unit when provided', async () => {
    const unit = { ...defaultUnit, id: 'u2' }
    unitRepo.units.push(unit)
    const res = await service.execute({ id: stored.id, unitId: 'u2' })
    expect(res.user.unitId).toBe('u2')
  })

  it('throws when user not found', async () => {
    await expect(service.execute({ id: 'x' })).rejects.toThrow('User not found')
  })

  it('throws when unit not exists', async () => {
    await expect(service.execute({ id: stored.id, unitId: 'bad' })).rejects.toThrow('Unit not exists')
  })
})
