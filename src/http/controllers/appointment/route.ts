import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateAppointmentController } from './create-appointment-controller'
import { ListAppointmentsController } from './list-appointments-controller'

export async function appointmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/appointment', CreateAppointmentController)
  app.get('/appointments', ListAppointmentsController)
}
