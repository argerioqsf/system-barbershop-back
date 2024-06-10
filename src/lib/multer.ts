import fastify from 'fastify'
import multer from 'fastify-multer'
const upload = multer({ dest: 'uploads/' })

const server = fastify()

server.register(multer.contentParser)

server.route({
  method: 'POST',
  url: '/profile',
  preHandler: upload.single('avatar'),
  handler: function (request, reply) {
    // request.file is the `avatar` file
    // request.body will hold the text fields, if there were any
    reply.code(200).send('SUCCESS')
  },
})
