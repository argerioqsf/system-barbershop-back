import { verifyJWT } from "@/http/middlewares/verify-jwt";
import { FastifyInstance } from "fastify";
import { List } from "./list";
import { GetIndicatorProfile } from "./get-indicator";
import { MountSelect } from "./mount-select";

export async function indicatorRoute(app: FastifyInstance) {
  app.addHook("onRequest", verifyJWT);

  app.get("/indicators", List);

  app.get("/indicator/:id", GetIndicatorProfile);

  app.get("/indicator/select", MountSelect);
}
