import { describe, it, expect } from 'vitest'
import { CommissionResolutionService } from './commission-resolution-service'
import { Profile, Service, BarberService } from '@prisma/client'

describe('CommissionResolutionService', () => {
  const service = new CommissionResolutionService()

  const mockService = { commissionPercentage: 10 } as Service
  const mockProfile = { commissionPercentage: 20 } as Profile
  const mockRelation = { commissionPercentage: 30 } as BarberService

  it('should return relation commission when it exists', () => {
    const commission = service.getPercentage(
      mockService,
      mockProfile,
      mockRelation,
    )
    expect(commission.toNumber()).toBe(30)
  })

  it('should return profile commission when relation commission does not exist', () => {
    const commission = service.getPercentage(mockService, mockProfile, null)
    expect(commission.toNumber()).toBe(20)
  })

  it('should return source (service/product) commission when relation and profile commissions do not exist', () => {
    const profileWithoutCommission = { commissionPercentage: 0 } as Profile
    const commission = service.getPercentage(
      mockService,
      profileWithoutCommission,
      null,
    )
    expect(commission.toNumber()).toBe(10)
  })

  it('should return 0 when no commission is defined anywhere', () => {
    const serviceWithoutCommission = { commissionPercentage: 0 } as Service
    const profileWithoutCommission = { commissionPercentage: 0 } as Profile
    const commission = service.getPercentage(
      serviceWithoutCommission,
      profileWithoutCommission,
      null,
    )
    expect(commission.toNumber()).toBe(0)
  })
})
