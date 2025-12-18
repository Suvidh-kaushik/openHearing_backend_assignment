## Backend (User Service)

This folder contains the backend **User Service** for the project. It is a TypeScript + Express API with MongoDB (Mongoose), Redis, RabbitMQ, JWT-based auth, and a Vitest test suite (unit + integration).

### Tech stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express
- **DB**: MongoDB via Mongoose
- **Cache / rate limiting / OTP storage**: Redis
- **Messaging**: RabbitMQ (for email/OTP queue)
- **Validation**: Zod
- **Auth**: JWT (HTTP-only cookie)
- **Testing**: Vitest + Supertest

---

### Project structure (backend/user)

```text
backend/
  user/
    src/
      config/          # env, mongo, redis, rabbitmq
      controllers/     # auth + user controllers
      middlewares/     # auth, validation, error handler
      models/          # Mongoose models
      routes/          # /auth and /users routes
      services/        # business logic for users
      utils/           # helpers (encryption, JWT, etc.)
    tests/
      unit/            # unit tests (services, middlewares, utils)
      integration/     # integration tests (auth + user APIs)
      setup/           # shared Vitest setup (e.g. console silencing)
    package.json
    tsconfig.json
    vitest.config.ts
```

---

### Prerequisites

- Node.js (LTS)
- pnpm
- MongoDB running and reachable via `MONGODB_URL`
- Redis running and reachable via `REDIS_URL`
- RabbitMQ running and reachable via `RABBIT_MQ_*` env vars

You can run Redis and RabbitMQ via Docker (example):

```yaml
version: "3.9"

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: resonately
      RABBITMQ_DEFAULT_PASS: resonately
      RABBITMQ_DEFAULT_VHOST: /
```

---

### Environment variables

Create a `.env` file in `backend/user` (or adjust to your setup):

```bash
PORT=3001

# MongoDB
MONGODB_URL=mongodb://localhost:27017/resonately_user

# JWT
JWT_SECRET=your_jwt_secret

# Crypto
SECRET_KEY=your_secret_key

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBIT_MQ_HOST=localhost
RABBIT_MQ_USER=resonately
RABBIT_MQ_PASSWORD=resonately
RABBIT_MQ_VHOST=/
```

---

### Install dependencies

From the `backend/user` directory:

```bash
cd backend/user
pnpm install
```

---

### Running the service

**Development mode (with tsx + hot reload):**

```bash
cd backend/user
pnpm dev
```

The service will start on `http://localhost:${PORT}` (default `3001`).

**Production build & start:**

```bash
cd backend/user
pnpm build
pnpm start
```

---

### Testing

All tests are implemented with **Vitest**.

From `backend/user`:

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration
```

- **Unit tests** live in `tests/unit` and cover:
  - `services/user` (create, list, update, soft-delete)
  - `middlewares/validators/user`
  - `utils/encrypt`
- **Integration tests** live in `tests/integration` and cover:
  - `/api/v1/auth/login`
  - `/api/v1/auth/verify`
  - `/api/v1/users` (create, list, validation, authorization)

---

### Key API endpoints (summary)

- **Auth**
  - `POST /api/v1/auth/login` — request OTP via email (rate-limited via Redis + RabbitMQ queue publish).
  - `POST /api/v1/auth/verify` — verify OTP, create/restore user, set JWT cookie.

- **Users** (JWT-protected)
  - `POST /api/v1/users` — create user for the authenticated email.
  - `GET /api/v1/users` — list users with filters and cursor-based pagination.
  - `PATCH /api/v1/users/:id` — update user (only self).
  - `DELETE /api/v1/users/:id` — soft-delete user (only self).

Use the integration tests as examples of expected request/response shapes. 


