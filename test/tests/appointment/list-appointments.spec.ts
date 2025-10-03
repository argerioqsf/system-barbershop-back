import { describe, it, expect, beforeEach } from 'vitest'
import { ListAppointmentsUseCase } from '../../../src/modules/appointment/application/use-cases/list-appointments'
import { FakeAppointmentRepository } from '../../helpers/fake-repositories'
import {
  appointment1 as a1,
  appointment2 as a2,
} from '../../helpers/default-values'

describe('List appointments use case', () => {
  let repo: FakeAppointmentRepository
  let useCase: ListAppointmentsUseCase

  beforeEach(() => {
    repo = new FakeAppointmentRepository()
    repo.appointments.push(a1, a2)
    useCase = new ListAppointmentsUseCase(repo)
  })

  it('lists all for admin', async () => {
    const res = await useCase.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.appointments).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await useCase.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.appointments).toHaveLength(1)
    expect(res.appointments[0].id).toBe('a1')
  })

  it('filters by unit for others', async () => {
    const res = await useCase.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    } as any)
    expect(res.appointments).toHaveLength(1)
    expect(res.appointments[0].id).toBe('a2')
  })

  it('throws if user not found', async () => {
    await expect(
      useCase.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'u1',
        organizationId: 'o1',
      } as any),
    ).rejects.toThrow('User not found')
  })
})
