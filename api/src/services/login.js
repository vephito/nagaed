import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials.");
  }
}

export function createLoginService(users, jwtSecret) {
  return {
    async login({ email, password }) {
      const user = await users.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new InvalidCredentialsError();
      }

      const token = jwt.sign({}, jwtSecret, {
        subject: String(user.id),
        expiresIn: "1h",
      });
      return { token, user: { id: user.id, username: user.username } };
    },
  };
}
