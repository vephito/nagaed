export function createUserRepository(pool) {
  return {
    async create({ username, email, passwordHash, address }) {
      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password_hash, address) VALUES (?, ?, ?, ?)",
        [username, email, passwordHash, address],
      );
      return result.insertId;
    },

    async findByEmail(email) {
      const [rows] = await pool.execute(
        "SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1",
        [email],
      );
      return rows[0] || null;
    },

    async findById(id) {
      const [rows] = await pool.execute(
        "SELECT id, username, email, address FROM users WHERE id = ? LIMIT 1",
        [id],
      );
      return rows[0] || null;
    },

    async isReady() {
      await pool.query("SELECT 1");
    },
  };
}
