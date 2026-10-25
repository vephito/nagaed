# Express API: registration, login, and user lookup

This is Task 1's Express API. Docker Compose also starts the frontend, FastAPI service, and MySQL.

## Start it

You need Docker running. From the project root:

```bash
cp -n .env.example .env
docker compose up
```

Compose waits for MySQL to be healthy before starting the API. The frontend is at http://localhost:8080. The API is at http://localhost:3000 and `GET /health` checks its database connection.

If port 3000 is busy, change `PORT` in `.env` to another host port, such as `3001`. After changing API code, run `docker compose up --build` to rebuild its image.

## Register a user

```bash
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alex_01","email":"alex@example.com","password":"my-secret-password","address":"42 Learning Road"}'
```

A successful request returns HTTP `201` and the new user's `id`, `username`, `email`, and `address`. It never returns the password or its hash.

Usernames use 3-30 letters, numbers, or underscores. Passwords need at least 8 characters; addresses need 5-500 characters.

The API returns HTTP `400` for missing or invalid fields and `409` when the email is already registered. Errors have this shape:

```json
{ "error": { "message": "Email already in use." } }
```

## Log in

```bash
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alex@example.com","password":"my-secret-password"}'
```

A successful request returns HTTP `200` with a signed JWT and the user's ID and username:

```json
{ "token": "<JWT>", "user": { "id": 1, "username": "alex_01" } }
```

The token expires after one hour. Missing or malformed fields return `400`; an incorrect email or password returns `401` with `"Invalid credentials."`. The JWT secret is loaded from `.env`, which should not be shared.

## Get your user record

Use the token returned by login and your user ID:

```bash
curl http://localhost:3000/api/users/1 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

A successful request returns `id`, `username`, `email`, and `address` in a `user` object. It never returns the password hash. A missing, invalid, or expired token returns `401`; another user's ID returns `403`; an unknown user returns `404`.

## How it works

- `src/server.js` creates one MySQL pool and passes it to `createApp(pool)`.
- `src/app.js` connects the route, controller, service, and repository.
- `src/routes/users.js` connects all three API endpoints to one controller.
- `src/controllers/users.js` validates requests, checks the JWT, and sends HTTP responses.
- `src/services/register.js` hashes the password and handles an existing email.
- `src/services/login.js` checks the bcrypt hash and signs a JWT.
- `src/repositories/users.js` contains the MySQL queries.
- `src/db.js` creates the MySQL connection pool.
- `db/init.sql` creates the `users` table when the Docker database is first created.
- `docker-compose.yml` in the project root starts MySQL and the API. MySQL data stays in a Docker volume.
- `api/Dockerfile` builds the API image.

The database uses parameterized SQL queries. Passwords are hashed before storage. Compose reads `.env` for the database values and passes them to the containers at startup; the API image does not contain `.env`. Inside Docker, the API connects to MySQL using the service name `db`. `.env` is ignored by Git; exclude it from any ZIP you share.

Registration and login follow **route → controller → service → repository → MySQL**. The user lookup goes from controller to repository because it only reads a record. The pool is created once in `server.js` and passed through `app.js` to the repository.

To stop the application, run `docker compose down` from the project root. The users remain in the Docker volume.
