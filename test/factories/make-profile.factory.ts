import { faker } from '@faker-js/faker'
import crypto from 'node:crypto'

type Overwrite = {
  userId?: string
}

export function makeProfile(overwrite?: Overwrite) {
  enum Role {
    administrator,
    consultant,
    indicator,
    coordinator,
    financial,
  }

  return {
    id: crypto.randomUUID(),
    userId: overwrite?.userId ?? crypto.randomUUID(),
    phone: faker.phone.number(),
    cpf: faker.string.numeric(11),
    genre: faker.person.gender(),
    birthday: faker.string.numeric(8),
    pix: faker.string.alphanumeric(36),
    role: Role.administrator,
  }
}
