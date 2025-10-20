import { randomUUID } from 'node:crypto'

import { IdGenerator } from '@/core/application/ports/id-generator'

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID()
  }
}

export const uuidGenerator = new UuidGenerator()
