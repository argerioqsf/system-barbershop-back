import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { ListTransactionsController } from './list-transactions-controller'
import { ListPendingCommissionsController } from './list-pending-commissions'
import { upload } from '@/lib/upload'
import { PayBalanceTransactionController } from './pay-balance-transaction'
import { WithdrawalBalanceTransactionController } from './withdrawal-balance-transaction'

export async function transactionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post(
    '/pay/transactions',
    {
      preHandler: [
        upload.single('receipt'),
        verifyPermission(['MANAGE_OTHER_USER_TRANSACTION']),
      ],
    },
    PayBalanceTransactionController,
  )
  app.post(
    '/withdrawal/transactions',
    {
      preHandler: [
        upload.single('receipt'),
        verifyPermission(['MANAGE_USER_TRANSACTION_WITHDRAWAL']),
      ],
    },
    WithdrawalBalanceTransactionController,
  )
  app.get(
    '/pay/pending/:userId',
    { preHandler: [verifyPermission(['MANAGE_OTHER_USER_TRANSACTION'])] },
    ListPendingCommissionsController,
  )
  app.get('/transactions', ListTransactionsController)
}
