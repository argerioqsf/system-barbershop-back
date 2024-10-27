import { CourseNotFoundError } from '@/services/@errors/course-not-found-error'
import { makeGetGraphicsService } from '@/services/@factories/graphics/make-get-graphics-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getGraphics(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getGraphicsService = makeGetGraphicsService()

  const userId = request.user.sub

  try {
    const { graphics } = await getGraphicsService.execute({ userId })

    return reply.status(200).send(graphics)
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
