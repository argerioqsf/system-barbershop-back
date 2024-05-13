import { makeMountSelectConsultantService } from "@/services/@factories/consultant/mount-select-consultant-service";
import { FastifyReply, FastifyRequest } from "fastify";

export async function MountSelect(request: FastifyRequest, replay: FastifyReply) {
  const mountSelectConsultantService = makeMountSelectConsultantService();

  const { user } = await mountSelectConsultantService.execute();

  return replay.status(200).send({ user });
}
