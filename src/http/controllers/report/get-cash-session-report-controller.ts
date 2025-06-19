import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCashSessionReport } from '@/services/@factories/report/make-cash-session-report'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetCashSessionReportController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ sessionId: z.string() })
    const { sessionId } = paramsSchema.parse(request.params)
    const service = makeCashSessionReport()
    const report = await service.execute({ sessionId })
    return reply.status(200).send(report)
  },
)
