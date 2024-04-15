import fastifyJwt from '@fastify/jwt'
import fastify from 'fastify'
import { ZodError } from 'zod'
import { env } from './env'
import { courseRoute } from './http/controllers/courses/route'
import { profileRoute } from './http/controllers/profile/route'
import { segmentRoute } from './http/controllers/segments/route'
import { unitRoute } from './http/controllers/units/route'
import { userRoute } from './http/controllers/user/route'
import { appRoute } from './http/routes/route'
import { unitCourseRoute } from './http/controllers/unit-course/route'
import { indicatorRoute } from './http/controllers/indicator/route'
import { leadsRoute } from './http/controllers/leads/route'
import { timelineRoute } from './http/controllers/timeline/route'

export const app = fastify()

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(appRoute)
app.register(unitRoute)
app.register(courseRoute)
app.register(segmentRoute)
app.register(profileRoute)
app.register(userRoute)
app.register(unitCourseRoute)
app.register(indicatorRoute)
app.register(leadsRoute)
app.register(timelineRoute)

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
