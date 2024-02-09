import fastify from 'fastify'
import { appRoute } from './http/routes/route'

export const app = fastify()

app.register(appRoute)
