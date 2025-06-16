import { MulterFile } from 'fastify-multer'

declare module 'fastify' {
  interface FastifyRequest {
    file?: MulterFile
    files?: MulterFile[]
  }
}
