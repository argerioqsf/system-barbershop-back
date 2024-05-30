import { UserTypeNotCompatible } from "@/services/@errors/user-type-not-compatible";
import makeUpdateLeadStartService from "@/services/@factories/leads/make-update-status-service";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
  documents: z.boolean(),
  matriculation: z.boolean(),
  courseId: z.string(),
  segmentId: z.string(),
  unitId: z.string(),
});

const routeSchema = z.object({
  id: z.string(),
});

export async function UpdateStatus(request: FastifyRequest, reply: FastifyReply) {
  const { documents, matriculation, courseId, segmentId, unitId } = bodySchema.parse(request.body);

  const updateLeadStatusService = makeUpdateLeadStartService();

  const { id } = routeSchema.parse(request.params);

  const userId = request.user.sub;

  try {
    const { lead } = await updateLeadStatusService.execute({
      id,
      documents,
      matriculation,
      userId,
      courseId,
      segmentId,
      unitId,
    });
    return reply.status(201).send(lead);
  } catch (error) {
    if (error instanceof UserTypeNotCompatible) {
      return reply.status(404).send({ message: error.message });
    }
    console.log(error);
    return reply.status(500).send({ message: "Internal server error" });
  }
}
