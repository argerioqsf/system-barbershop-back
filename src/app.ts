import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import multer from 'fastify-multer'
import fs from 'fs'
import path from 'path'
import { uploadDir, upload } from './lib/upload'
import { ZodError } from 'zod'
import { env } from './env'
import { profileRoute } from './http/controllers/profile/route'
import { barberShopServiceRoute } from './http/controllers/barber-shop/route'
import { appointmentRoute } from './http/controllers/appointment/route'
import { barberUserRoute } from './http/controllers/barber-user/route'
import { couponRoute } from './http/controllers/coupon/route'
import { cashRegisterRoute } from './http/controllers/cash-register/route'
import { saleRoute } from './http/controllers/sale/route'
import { transactionRoute } from './http/controllers/transaction/route'
import { reportRoute } from './http/controllers/report/route'
import { configRoute } from './http/controllers/config/route'
import { authRoute } from './http/controllers/auth/route'


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
    console.log('Uploaded file:', request.file)
    if (!request.file) {
      return reply.code(400).send('No file uploaded.')
    }
    reply.code(200).send('SUCCESS')
  },
})

app.route({
  method: 'GET',
  url: '/uploads',
  handler: function (request, reply) {
    fs.readdir(uploadDir, { withFileTypes: true }, (err, files) => {
      if (err) {
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
          reply.code(500).send('Failed to delete file')
        } else {
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

app.register(authRoute)
app.register(profileRoute)
app.register(barberShopServiceRoute)
app.register(appointmentRoute)
app.register(barberUserRoute)
app.register(couponRoute)
app.register(cashRegisterRoute)
app.register(transactionRoute)
app.register(saleRoute)
app.register(reportRoute)
app.register(configRoute)

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
