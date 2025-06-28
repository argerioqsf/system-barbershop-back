import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { ListTransactionsController } from './list-transactions-controller'
import { upload } from '@/lib/upload'
import { PayBalanceTransactionController } from './pay-balance-transaction'

export async function transactionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post(
    '/pay/transactions',
    {
      preHandler: [
        upload.single('receipt'),
        verifyPermission(['MANAGE_USER_TRANSACTION_WITHDRAWAL']),
      ],
    },
    PayBalanceTransactionController,
  )
  app.get('/transactions', ListTransactionsController)
}
