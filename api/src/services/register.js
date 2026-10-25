import bcrypt from "bcryptjs";

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Email already in use.");
  }
}

export function createRegistrationService(users) {
  return {
    async register({ username, email, password, address }) {
      const passwordHash = await bcrypt.hash(password, 12);

      try {
        const id = await users.create({ username, email, passwordHash, address });
        return { id, username, email, address };
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") throw new EmailAlreadyInUseError();
        throw error;
      }
    },
  };
}
