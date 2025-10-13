import { FastifyInstance } from 'fastify'
import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { getCollaboratorDashboardController } from './get-collaborator-dashboard.controller'
import { listPendingCommissionAppointmentsController } from './list-pending-commission-appointments.controller'
import { listPendingCommissionSaleItemsController } from './list-pending-commission-sale-items.controller'

export async function collaboratorRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/collaborators/me/dashboard', getCollaboratorDashboardController)
  app.get(
    '/collaborators/:userId/pending-commission-sale-items',
    listPendingCommissionSaleItemsController,
  )
  app.get(
    '/collaborators/:userId/pending-commission-appointments',
    listPendingCommissionAppointmentsController,
  )
}
