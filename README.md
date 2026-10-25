# NagaEd account demo

A small account app built with React, Express, MySQL, and FastAPI.

## Contact

Vephito — [vephitodasai5@gmail.com](mailto:vephitodasai5@gmail.com)

## Features

- Register with a username, email, password, and address.
- Log in and view your profile. Passwords are hashed, and login uses a JWT.
- Enter interests to get three AI username suggestions when a Groq key is configured.

## Run

Start Docker, then run these commands from the project root:

```bash
cp -n .env.example .env
docker compose up
```

These commands start all four services. The `-n` flag keeps an existing `.env` file. Registration, login, and profile viewing work with the example settings. AI username suggestions require a private `GROQ_API_KEY` in `.env`; Groq cannot generate them without a key. Keep that key out of `.env.example` and other shared files.

Open the frontend at http://localhost:8080. The Express API is at http://localhost:3000; http://localhost:3000/health checks its database connection. FastAPI docs are at http://localhost:8000/docs. MySQL is available only to the containers. If a host port is busy, change `FRONTEND_PORT`, `PORT`, or `AI_PORT` in `.env`.

## Suggest usernames

```bash
curl -X POST http://localhost:8000/api/suggest-username \
  -H 'Content-Type: application/json' \
  -d '{"interests":["music","coding"]}'
```

With a Groq key, the response is `{ "suggestions": ["name1", "name2", "name3"] }`. Malformed input returns `422`, a missing key returns `503`, and a Groq failure returns `502`.

To stop the containers, press Ctrl+C. Run `docker compose down` to remove the containers while keeping the MySQL data volume. After changing code, run `docker compose up --build` to rebuild the images.

## Project files

- `frontend/` contains the React app. Its API calls are in `frontend/src/api.js`.
- `api/` contains the Express routes, controller, services, and MySQL repository. See [API details](api/README.md) for request examples.
- `ai/` contains the FastAPI service and its Groq call.
- `docker-compose.yml` starts the frontend, Express API, FastAPI service, and MySQL together.
- [Architecture diagram](docs/architecture.png) shows their ports and connections.

Vite builds React into HTML, CSS, and JavaScript files. Nginx serves those files to the browser. It forwards `/api/suggest-username` to FastAPI (`ai:8000`) and the other `/api` requests to Express (`api:3000`). Compose reads the root `.env` file and passes each service its settings at startup. Keep `.env` private; it is ignored by Git.

