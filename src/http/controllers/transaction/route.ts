import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { ListTransactionsController } from './list-transactions-controller'
import { upload } from '@/lib/upload'
import { WithdrawalBalanceTransactionController } from './withdrawal-balance-transaction'
import { AddBalanceTransactionController } from './add-balance-transaction'

export async function transactionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post(
    '/add/transactions',
    {
      preHandler: [
        upload.single('receipt'),
        verifyPermission('MANAGE_USER_TRANSACTION_ADD'),
      ],
    },
    AddBalanceTransactionController,
  )
  app.post(
    '/withdrawal/transactions',
    {
      preHandler: [
        upload.single('receipt'),
        verifyPermission('MANAGE_USER_TRANSACTION_WITHDRAWAL'),
      ],
    },
    WithdrawalBalanceTransactionController,
  )
  app.get(
    '/transactions',
    { preHandler: verifyPermission('LIST_TRANSACTIONS') },
    ListTransactionsController,
  )
}
