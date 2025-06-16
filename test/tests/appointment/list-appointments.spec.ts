import { describe, it, expect, beforeEach } from 'vitest'
import { ListAppointmentsService } from '../../../src/services/appointment/list-appointments'
import { InMemoryAppointmentRepository } from '../../helpers/fake-repositories'
import { appointment1 as a1, appointment2 as a2 } from '../../helpers/default-values'

describe('List appointments service', () => {
  let repo: InMemoryAppointmentRepository
  let service: ListAppointmentsService

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository()
    repo.appointments.push(a1, a2)
    service = new ListAppointmentsService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({ sub: '1', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.appointments).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({ sub: '1', role: 'OWNER', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.appointments).toHaveLength(1)
    expect(res.appointments[0].id).toBe('a1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({ sub: '1', role: 'BARBER', unitId: 'unit-2', organizationId: 'org-2' } as any)
    expect(res.appointments).toHaveLength(1)
    expect(res.appointments[0].id).toBe('a2')
  })

  it('throws if user not found', async () => {
    await expect(service.execute({ sub: '', role: 'ADMIN', unitId: 'u1', organizationId: 'o1' } as any)).rejects.toThrow('User not found')
  })
})
