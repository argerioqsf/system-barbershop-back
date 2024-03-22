import { makeGetCoursesService } from "@/services/factories/make-get-courses-service";
import { FastifyReply, FastifyRequest } from "fastify";

export async function GetCoursesController(request: FastifyRequest, replay: FastifyReply) {
  const getCoursesService = makeGetCoursesService();

  const { courses } = await getCoursesService.execute();

  return replay.status(200).send({
    courses: {
      courses: courses,
    },
  });
}
