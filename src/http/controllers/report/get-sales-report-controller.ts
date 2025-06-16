import { makeSalesReport } from '@/services/@factories/report/make-sales-report'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function GetSalesReportController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const querySchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  const { startDate, endDate } = querySchema.parse(request.query)
  const service = makeSalesReport()
  const report = await service.execute({ startDate, endDate })
  return reply.status(200).send(report)
}
