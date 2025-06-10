import multer from 'fastify-multer'
import fs from 'fs'
import path from 'path'

export const uploadDir = path.join('/opt/app/uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

export const upload = multer({ dest: uploadDir })
