import { app } from './app'
import { env } from './env'

app.get('/health', (req, res) => {
  res.status(200).send('health')
})

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log('Server is runner')
  })
