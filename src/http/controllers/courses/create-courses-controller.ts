import { CourseNotFoundError } from "@/services/errors/course-not-found-error";
import makeCreateCourseService from "@/services/factories/make-create-course-service";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string(),
  active: z.boolean(),
});

export async function CreateCoursesController(request: FastifyRequest, reply: FastifyReply) {
  const body = bodySchema.parse(request.body);

  const createCoursesService = makeCreateCourseService();

  try {
    const { course } = await createCoursesService.execute({ ...body });

    return reply.status(201).send(course);
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error(error);

    return reply.status(500).send({ message: "Internal server error" });
  }

}
