import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import multer from 'fastify-multer'
import fs from 'fs'
import path from 'path'
import { uploadDir, upload } from './lib/upload'
import { ZodError } from 'zod'
import { env } from './env'
import { handleControllerError } from './utils/http-error-handler'
import { logger } from './lib/logger'
import { profileRoute } from './http/controllers/profile/route'
import { profileHoursRoute } from './http/controllers/profile-hours/route'
import { barberShopServiceRoute } from './http/controllers/barber-shop/route'
import { productRoute } from './http/controllers/product/route'
import { serviceRoute } from './http/controllers/service/route'
import { appointmentRoute } from './http/controllers/appointment/route'
import { barberUserRoute } from './http/controllers/barber-user/route'
import { couponRoute } from './http/controllers/coupon/route'
import { cashRegisterRoute } from './http/controllers/cash-register/route'
import { saleRoute } from '@/modules/sale/infra/http/route'
import { transactionRoute } from './http/controllers/transaction/route'
import { reportRoute } from './http/controllers/report/route'
import { configRoute } from './http/controllers/config/route'
import { permissionRoute } from './http/controllers/permission/route'
import { roleRoute } from './http/controllers/role/route'
import { loanRoute } from './http/controllers/loan/route'
import { authRoute } from './http/controllers/auth/route'
import { organizationRoute } from './http/controllers/organization/route'
import { unitRoute } from './http/controllers/unit/route'
import { sessionRoute } from './http/controllers/session/route'
import { unitOpeningHourRoute } from './http/controllers/unit-opening-hour/route'
import { categoryRoute } from './http/controllers/category/route'
import { collaboratorRoute } from './http/controllers/collaborators/route'
import { planRoute } from './http/controllers/plan/route'
import { planProfileRoute } from './http/controllers/plan-profile/route'
import { debtRoute } from './http/controllers/debt/route'
import { benefitRoute } from './http/controllers/benefit/route'
import { typeRecurrenceRoute } from './http/controllers/type-recurrence/route'
import { userRoute } from './http/controllers/user/route'

export const app = fastify()

app.register(multer.contentParser)

app.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/uploads/',
})

app.route({
  method: 'POST',
  url: '/upload',
  preHandler: upload.single('avatar'),
  handler: function (request, reply) {
    if (!request.file) {
      return reply.code(400).send('No file uploaded.')
    }
    logger.info('File uploaded', {
      filename: request.file.filename,
      mimetype: request.file.mimetype,
    })
    reply.code(200).send('SUCCESS')
  },
})

app.route({
  method: 'GET',
  url: '/uploads',
  handler: function (request, reply) {
    fs.readdir(uploadDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        logger.error('Unable to scan uploads directory', { error: err })
        reply.code(500).send('Unable to scan directory: ' + err)
        return
      }

      const fileUrls = files
        .map((file) => {
          const filePath = `${uploadDir}/${file.name}`
          const stats = fs.statSync(filePath)
          return { file, stats }
        })
        .sort((a, b) => b.stats.ctimeMs - a.stats.ctimeMs)
        .map((fileStats) => ({
          filename: fileStats.file.name,
          url: `/uploads/${fileStats.file.name}`,
        }))

      reply.code(200).send(fileUrls)
    })
  },
})

app.route({
  method: 'GET',
  url: '/uploads/:filename',
  handler: function (request, reply) {
    const { filename } = request.params as { filename: string }
    const filePath = path.join(uploadDir, filename)

    if (fs.existsSync(filePath)) {
      reply.type('image/jpeg')
      reply.send(fs.createReadStream(filePath))
    } else {
      reply.code(404).send('File not found')
    }
  },
})

app.route({
  method: 'DELETE',
  url: '/uploads/:filename',
  handler: function (request, reply) {
    const { filename } = request.params as { filename: string }
    const filePath = path.join(uploadDir, filename)

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error('Failed to delete uploaded file', {
            filename,
            error: err,
          })
          reply.code(500).send('Failed to delete file')
        } else {
          logger.info('File deleted successfully', { filename })
          reply.code(200).send('File deleted successfully')
        }
      })
    } else {
      reply.code(404).send('File not found')
    }
  },
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.addHook('onSend', async (request, reply, payload) => {
  if (request.newToken) {
    reply.header('x-new-token', request.newToken)
  }
  return payload
})

app.register(authRoute)
app.register(sessionRoute)
app.register(profileRoute)
app.register(profileHoursRoute)
app.register(productRoute)
app.register(serviceRoute)
app.register(categoryRoute)
app.register(barberShopServiceRoute)
app.register(appointmentRoute)
app.register(barberUserRoute)
app.register(couponRoute)
app.register(cashRegisterRoute)
app.register(loanRoute)
app.register(transactionRoute)
app.register(permissionRoute)
app.register(roleRoute)
app.register(organizationRoute)
app.register(unitRoute)
app.register(unitOpeningHourRoute)
app.register(planRoute)
app.register(planProfileRoute)
app.register(debtRoute)
app.register(benefitRoute)
app.register(typeRecurrenceRoute)
app.register(saleRoute)
app.register(reportRoute)
app.register(configRoute)
app.register(userRoute)
app.register(collaboratorRoute)

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: 'Validation error', issues: error.format() })
  }

  logger.error('Unhandled application error', {
    error,
    path: reply.request.url,
    method: reply.request.method,
  })

  return handleControllerError(error, reply)
})
