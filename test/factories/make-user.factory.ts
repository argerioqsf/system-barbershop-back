import { faker } from '@faker-js/faker'
import crypto from 'node:crypto'

type Overwrite = {
  password?: string
}

export function makeUser(overwrite?: Overwrite) {
  return {
    id: crypto.randomUUID(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: overwrite?.password ?? faker.internet.password(),
    active: false,
  }
}
