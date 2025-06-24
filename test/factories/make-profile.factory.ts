import { faker } from '@faker-js/faker'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  RoleName,
} from '@prisma/client'
import crypto from 'node:crypto'

type Overwrite = {
  userId?: string
}

export function makeProfile(overwrite?: Overwrite): Profile & {
  role: Role
  permissions: Permission[]
  workHours: ProfileWorkHour[]
  blockedHours: ProfileBlockedHour[]
  barberServices: BarberService[]
} {
  return {
    id: crypto.randomUUID(),
    userId: overwrite?.userId ?? crypto.randomUUID(),
    phone: faker.phone.number(),
    cpf: faker.string.numeric(11),
    genre: faker.person.gender(),
    birthday: faker.string.numeric(8),
    pix: faker.string.alphanumeric(36),
    role: {
      id: crypto.randomUUID(),
      name: RoleName.ADMIN,
      unitId: 'unit-1',
    },
    roleId: 'rl-1',
    commissionPercentage: 0,
    totalBalance: 0,
    createdAt: new Date(),
    permissions: [],
    workHours: [],
    blockedHours: [],
    barberServices: [],
  }
}
