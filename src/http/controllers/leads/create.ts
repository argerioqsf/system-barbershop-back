import { LeadsNotFoundError } from "@/services/@errors/leads-not-found-error";
import makeCreateLeadsService from "@/services/@factories/leads/make-create-leads-service";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  email: z.string(),
  city: z.string(),
  indicatorId: z.string(),
  consultantId: z.string(),
});

export async function Create(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body);

  const createLeadsService = makeCreateLeadsService();

  try {
    const { leads } = await createLeadsService.execute({ ...body });

    return reply.status(201).send(leads);
  } catch (error) {
    if (error instanceof LeadsNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}
