import express from "express";
import { createUserRouter } from "./routes/users.js";
import { createUserController } from "./controllers/users.js";
import { createRegistrationService } from "./services/register.js";
import { createLoginService } from "./services/login.js";
import { createUserRepository } from "./repositories/users.js";

export function createApp(pool, jwtSecret = process.env.JWT_SECRET) {
  if (!jwtSecret) throw new Error("JWT_SECRET must be set in .env");

  const app = express();
  const users = createUserRepository(pool);
  const registration = createRegistrationService(users);
  const authentication = createLoginService(users, jwtSecret);
  const controller = createUserController(registration, authentication, users, jwtSecret);

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ message: "Express API is running." });
  });

  app.get("/health", async (req, res) => {
    try {
      await users.isReady();
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ error: { message: "Database is unavailable." } });
    }
  });

  app.use("/api", createUserRouter(controller));

  return app;
}
