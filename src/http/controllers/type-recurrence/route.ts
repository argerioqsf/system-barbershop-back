import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateTypeRecurrenceController } from './create-type-recurrence-controller'
import { ListTypeRecurrencesController } from './list-type-recurrences-controller'
import { GetTypeRecurrenceController } from './get-type-recurrence-controller'
import { UpdateTypeRecurrenceController } from './update-type-recurrence-controller'
import { DeleteTypeRecurrenceController } from './delete-type-recurrence-controller'

export async function typeRecurrenceRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)
  app.post('/type-recurrences', CreateTypeRecurrenceController)
  app.get('/type-recurrences', ListTypeRecurrencesController)
  app.get('/type-recurrences/:id', GetTypeRecurrenceController)
  app.patch('/type-recurrences/:id', UpdateTypeRecurrenceController)
  app.delete('/type-recurrences/:id', DeleteTypeRecurrenceController)
}
