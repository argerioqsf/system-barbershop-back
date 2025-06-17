import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateTransactionController } from './create-transaction-controller'
import { ListTransactionsController } from './list-transactions-controller'
import { upload } from '@/lib/upload'

export async function transactionRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post(
    '/transactions',
    { preHandler: upload.single('receipt') },
    CreateTransactionController,
  )
  app.get('/transactions', ListTransactionsController)
}
