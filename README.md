# ChatBox

Real-time chat application built with Docker Compose.

## Architecture

| Container | Image               | Role                   |
| --------- | ------------------- | ---------------------- |
| app       | Node.js 20 (custom) | Web server + Socket.io |
| redis     | redis:7-alpine      | pub/sub message broker |
| mongo     | mongo:7             | chat history storage   |

## Run

```bash
docker compose up -d --build
```

Open http://localhost:3000

## Stop

```bash
docker compose down
```

## Clean up (ลบ volume ด้วย)

```bash
docker compose down -v
```
