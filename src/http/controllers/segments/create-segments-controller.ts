import { makeCreateSegmentsService } from "@/services/factories/make-create-segments-service";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string(),
});

export async function CreateSegmentsController(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body);

  const createSegmentService = makeCreateSegmentsService();

  try {
    const { segments } = await createSegmentService.execute({ ...body });

    return reply.status(201).send(segments);
  } catch (error) {
    console.error(error);

    return reply.status(500).send({ message: "Internal server error" });
  }
}
