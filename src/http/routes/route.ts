import { FastifyInstance } from "fastify";
import { register } from "../controllers/register-controller";
import { authenticate } from "../controllers/authenticate-controller";
import { profile } from "../controllers/profile-controller";
import { verifyJWT } from "../middlewares/verify-jwt";
import { createProfileController } from "../controllers/profile/create-profile-controller";
import { CreateCoursesController } from "../controllers/courses/create-courses-controller";
import { GetCoursesController } from "../controllers/courses/get-courses-controller";

export async function appRoute(app: FastifyInstance) {
  app.post("/users", register);
  app.post("/sessions", authenticate);

  // authenticated
  app.get("/me/:id", { onRequest: [verifyJWT] }, profile);
  app.post("/create/profile", { onRequest: [verifyJWT] }, createProfileController);
  app.post("/create/course", { onRequest: [verifyJWT] }, CreateCoursesController);
  app.get("/courses", { onRequest: [verifyJWT] }, GetCoursesController);
}
