# NagaEd account demo

A small React frontend with an Express API, MySQL, and a FastAPI username suggestion service. Users can register, log in, view their account, and optionally get username ideas from their interests.

## Contact

Vephito — [vephitodasai5@gmail.com](mailto:vephitodasai5@gmail.com)

## Run

Start Docker, then run these commands from the project root:

```bash
cp .env.example .env
docker compose up
```

The example settings start every container. Replace the sample `JWT_SECRET` before using the app outside local testing. Add your own `GROQ_API_KEY` to `.env` to enable username suggestions.

Open the frontend at http://localhost:8080. The Express API is at http://localhost:3000; http://localhost:3000/health checks its database connection. FastAPI docs are at http://localhost:8000/docs. MySQL is available only to the containers. If a host port is busy, change `FRONTEND_PORT`, `PORT`, or `AI_PORT` in `.env`.

The Groq key is needed only when requesting username suggestions. The FastAPI service and `/docs` still start without it.

## Suggest usernames

```bash
curl -X POST http://localhost:8000/api/suggest-username \
  -H 'Content-Type: application/json' \
  -d '{"interests":["music","coding"]}'
```

The response is `{ "suggestions": ["name1", "name2", "name3"] }`. Malformed input returns `422`, a missing Groq key returns `503`, and a Groq failure returns `502`.

To stop the containers, press Ctrl+C. Run `docker compose down` to remove the containers while keeping the MySQL data volume. After changing code, run `docker compose up --build` to rebuild the images.

## Project files

- `frontend/` contains the React app. Its API calls are in `frontend/src/api.js`.
- `api/` contains the Express routes, controller, services, and MySQL repository. See [API details](api/README.md) for request examples.
- `ai/` contains the FastAPI service and its Groq call.
- `docker-compose.yml` starts the frontend, Express API, FastAPI service, and MySQL together.
- [Architecture diagram](docs/architecture.png) shows their ports and connections.

Vite builds React into HTML, CSS, and JavaScript files. Nginx serves those files to the browser. It forwards `/api/suggest-username` to FastAPI (`ai:8000`) and the other `/api` requests to Express (`api:3000`). Compose reads the root `.env` file and passes each service its settings at startup. Keep `.env` private; it is ignored by Git.

