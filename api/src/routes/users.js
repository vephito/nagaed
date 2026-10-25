import { Router } from "express";

export function createUserRouter(controller) {
  const router = Router();
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/users/:id", controller.getById);
  return router;
}
