import jwt from "jsonwebtoken";
import { EmailAlreadyInUseError } from "../services/register.js";
import { InvalidCredentialsError } from "../services/login.js";

const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createUserController(registration, authentication, users, jwtSecret) {
  return {
    async register(req, res) {
      const { username, email, password, address } = req.body || {};

      if (typeof username !== "string" || !usernamePattern.test(username.trim())) {
        return res.status(400).json({ error: { message: "Username must be 3-30 letters, numbers, or underscores." } });
      }
      if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim())) {
        return res.status(400).json({ error: { message: "Enter a valid email address." } });
      }
      if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ error: { message: "Password must be at least 8 characters and at most 72 bytes." } });
      }
      if (typeof address !== "string" || address.trim().length < 5 || address.trim().length > 500) {
        return res.status(400).json({ error: { message: "Address must be 5-500 characters." } });
      }

      try {
        const user = await registration.register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          address: address.trim(),
        });
        res.status(201).json({ user });
      } catch (error) {
        if (error instanceof EmailAlreadyInUseError) {
          return res.status(409).json({ error: { message: error.message } });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: { message: "Something went wrong. Please try again." } });
      }
    },

    async login(req, res) {
      const { email, password } = req.body || {};
      if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim())) {
        return res.status(400).json({ error: { message: "Enter a valid email address." } });
      }
      if (typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: { message: "Enter a password." } });
      }

      try {
        const result = await authentication.login({ email: email.trim().toLowerCase(), password });
        res.json(result);
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return res.status(401).json({ error: { message: error.message } });
        }
        console.error("Login error:", error);
        res.status(500).json({ error: { message: "Something went wrong. Please try again." } });
      }
    },

    async getById(req, res) {
      const token = /^Bearer (.+)$/i.exec(req.get("authorization") || "")?.[1];
      if (!token) {
        return res.status(401).json({ error: { message: "A valid token is required." } });
      }

      let payload;
      try {
        payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
      } catch {
        return res.status(401).json({ error: { message: "A valid token is required." } });
      }

      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: { message: "User ID must be a positive number." } });
      }
      if (payload.sub !== String(id)) {
        return res.status(403).json({ error: { message: "You can only view your own record." } });
      }

      try {
        const user = await users.findById(id);
        if (!user) return res.status(404).json({ error: { message: "User not found." } });
        res.json({ user });
      } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: { message: "Something went wrong. Please try again." } });
      }
    },
  };
}
