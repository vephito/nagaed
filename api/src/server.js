import { createApp } from "./app.js";
import { createDatabasePool } from "./db.js";

const port = process.env.PORT || 3000;
const pool = createDatabasePool();
const app = createApp(pool);

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
