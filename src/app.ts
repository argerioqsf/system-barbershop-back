import fastifyJwt from '@fastify/jwt'
import fastify from 'fastify'
import multer from 'fastify-multer'
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
import { consultantRoute } from './http/controllers/consultant/route'
import { OrganizationRoute } from './http/controllers/organization/route'
import { timelineRoute } from './http/controllers/timeline/route'
import { cycleRoute } from './http/controllers/cycle/route'

const upload = multer({ dest: 'uploads/' })

export const app = fastify()

app.register(multer.contentParser)

app.route({
  method: 'POST',
  url: '/upload/profile',
  preHandler: upload.single('avatar'),
  handler: function (request, reply) {
    // request.file is the `avatar` file
    // request.body will hold the text fields, if there were any
    reply.code(200).send('SUCCESS')
  },
})

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
app.register(consultantRoute)
app.register(OrganizationRoute)
app.register(timelineRoute)
app.register(cycleRoute)

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
