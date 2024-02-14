import fastify from 'fastify'
import { appRoute } from './http/routes/route'
import { ZodError } from 'zod'
import { env } from './env'

export const app = fastify()

app.register(appRoute)

app.setErrorHandler((error, _, replay) => {
  if (error instanceof ZodError) {
    return replay
      .status(400)
      .send({ message: 'Validation error', issues: error.format() })
  }

  if (env.NODE_ENV !== 'production') {
    console.log(error)
  }

  return replay.status(500).send({ message: 'Internal server error' })
})
