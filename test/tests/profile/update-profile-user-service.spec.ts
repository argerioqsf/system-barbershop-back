import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateProfileUserService } from '../../../src/services/profile/update-profile-user-service'
import { InMemoryUserRepository } from '../../../src/repositories/in-memory/in-memory-users-repository'
import { FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'
import { UserNotFoundError } from '../../../src/services/@errors/user-not-found-error'
import { ProfileNotFoundError } from '../../../src/services/@errors/profile-not-found-error'

describe('Update profile user service', () => {
  let userRepo: InMemoryUserRepository
  let profileRepo: FakeProfilesRepository
  let service: UpdateProfileUserService

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    profileRepo = new FakeProfilesRepository()
    service = new UpdateProfileUserService(userRepo, profileRepo)
  })

  it('updates profile and user', async () => {
    const user = await userRepo.create({
      name: 'John',
      email: 'j@e.com',
      password: '123',
      organization: { connect: { id: 'org-1' } },
      unit: { connect: { id: 'unit-1' } },
    })
    profileRepo.profiles.push({ ...makeProfile('p1', user.id, 0), user: { ...user, password: '' } })

    const res = await service.execute({
      id: user.id,
      name: 'New',
      email: 'new@test.com',
      active: true,
      phone: '3',
      cpf: '4',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
    })

    expect(res.user?.name).toBe('New')
    expect(res.profile.phone).toBe('3')
  })

  it('throws when user not found', async () => {
    await expect(
      service.execute({
        id: 'no',
        name: '',
        email: '',
        active: true,
        phone: '',
        cpf: '',
        genre: '',
        birthday: '',
        pix: '',
        role: 'BARBER' as any,
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('throws when profile not found', async () => {
    const user = await userRepo.create({
      name: 'John',
      email: 'j@x.com',
      password: '123',
      organization: { connect: { id: 'org-1' } },
      unit: { connect: { id: 'unit-1' } },
    })

    await expect(
      service.execute({
        id: user.id,
        name: 'n',
        email: '',
        active: true,
        phone: '',
        cpf: '',
        genre: '',
        birthday: '',
        pix: '',
        role: 'BARBER' as any,
      }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError)
  })
})

