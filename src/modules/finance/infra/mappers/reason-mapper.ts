import { ReasonTransaction } from '@prisma/client'
import { TransactionReason } from '../../domain/entities/transaction'

export class ReasonMapper {
  static toPrisma(reason: TransactionReason): ReasonTransaction {
    return reason as ReasonTransaction
  }

  static toDomain(reason: ReasonTransaction): TransactionReason {
    return reason as TransactionReason
  }
}
