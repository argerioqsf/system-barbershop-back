import { describe, it, expect, beforeEach } from 'vitest'
import { GetUserProfileFromUserIdService } from '../src/services/profile/get-profile-from-userId-service'
import { FakeProfilesRepository } from './helpers/fake-repositories'
import { ResourceNotFoundError } from '../src/services/@errors/resource-not-found-error'

describe('Get profile from user id service', () => {
  let repo: FakeProfilesRepository
  let service: GetUserProfileFromUserIdService

  beforeEach(() => {
    repo = new FakeProfilesRepository()
    service = new GetUserProfileFromUserIdService(repo)
  })

  it('returns profile', async () => {
    repo.profiles.push({
      id: 'p1',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
      commissionPercentage: 100,
      totalBalance: 0,
      userId: 'u1',
      createdAt: new Date(),
      user: {
        id: 'u1',
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: 'unit-1',
        createdAt: new Date(),
      },
    })
    const res = await service.execute({ id: 'u1' })
    expect(res.profile?.id).toBe('p1')
  })

  it('throws when not found', async () => {
    await expect(service.execute({ id: 'no' })).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})

