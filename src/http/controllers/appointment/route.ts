import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateAppointmentController } from './create-appointment-controller'
import { ListAppointmentsController } from './list-appointments-controller'
import { ListAvailableBarbersController } from './list-available-barbers-controller'

export async function appointmentRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/create/appointment', CreateAppointmentController)
  app.get('/appointments', ListAppointmentsController)
  app.get('/appointment-barbers', ListAvailableBarbersController)
}
