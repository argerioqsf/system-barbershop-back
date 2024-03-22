import { makeCreateUnitService } from "@/services/factories/make-unit-service";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string(),
});

export async function CreateUnitController(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body);

  const createUnitService = makeCreateUnitService();

  try {
    const { unit } = await createUnitService.execute({ ...body });

    return reply.status(201).send(unit);
  } catch (error) {
    console.error(error);

    return reply.status(500).send({ message: "Internal server error" });
  }
}
