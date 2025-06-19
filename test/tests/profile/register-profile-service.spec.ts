import { describe, it, expect, beforeEach } from 'vitest'
import { CreateProfileService } from '../../../src/services/profile/register-profile-service'
import { InMemoryUserRepository } from '../../../src/repositories/in-memory/in-memory-users-repository'
import { FakeProfilesRepository } from '../../helpers/fake-repositories'
import { UserNotFoundError } from '../../../src/services/@errors/user/user-not-found-error'

describe('Create profile service', () => {
  let userRepo: InMemoryUserRepository
  let profileRepo: FakeProfilesRepository
  let service: CreateProfileService

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    profileRepo = new FakeProfilesRepository()
    service = new CreateProfileService(userRepo, profileRepo)
  })

  it('throws when user not found', async () => {
    await expect(
      service.execute({
        phone: '',
        cpf: '',
        genre: '',
        birthday: '',
        pix: '',
        role: 'BARBER' as any,
        roleModelId: 'role-1',
        userId: 'u1',
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('creates profile', async () => {
    const user = await userRepo.create({
      name: 'John',
      email: 'j@e.com',
      password: '123',
      organization: { connect: { id: 'org-1' } },
      unit: { connect: { id: 'unit-1' } },
    })

    const res = await service.execute({
      phone: '1',
      cpf: '2',
      genre: 'M',
      birthday: '2000',
      pix: 'x',
      role: 'BARBER' as any,
      roleModelId: 'role-1',
      userId: user.id,
    })

    expect(profileRepo.profiles).toHaveLength(1)
    expect(res.profile.userId).toBe(user.id)
  })
})

