import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { OpenSessionController } from './open-session-controller'
import { CloseSessionController } from './close-session-controller'
import { ListSessionsController } from './list-sessions-controller'

export async function cashRegisterRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/cash-session/open', OpenSessionController)
  app.put('/cash-session/close', CloseSessionController)
  app.get(
    '/cash-session',
    { preHandler: verifyPermission('LIST_CASH_SESSIONS') },
    ListSessionsController,
  )
}
