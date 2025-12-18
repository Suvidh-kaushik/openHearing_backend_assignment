## Backend (User Service)


<img width="993" height="450" alt="Screenshot from 2025-12-18 16-22-26" src="https://github.com/user-attachments/assets/ee901c32-44cc-4935-b1bd-fb22c2a1caf4" />

### Architecture Overview
The entire backend is made up of 2 service the user and the mail service
The main API's of 
 - create
 - update
 - get
   
Are present in the user service which is auth protected
The authentication is done using a mail-based otp generation, this otp is generated and sent to the mails service througha rabbitmq message broker which sends it to the user using nodemailer
The otp is stored and verified using redis but we use MongoDB as the main DB for the entire project
After authentication a user perform create,get,update and delete operations
The delete functionality is soft-delete in nature meaning we do not remove userdata from the db, whenever a user tries to re-login we get him back meaning he is no-longer deleted

## Features
- Soft DELETE feature
- Cursor Based Pagination
- RateLimiting
- Layered Architecture with model,service,controller and routes
- API request Validation
- Middleware protection (authentication)
- Test setup using vitest

## Pain Points/Learnings
- Setup and writing of tests was the toughest, never setup or wrote tests with the vitest library
- Cursor based pagination 
- Handling type-safety in typescript

### Tech stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express
- **DB**: MongoDB via Mongoose
- **OTP storage**: Redis
- **Messaging**: RabbitMQ (for email/OTP queue)
- **Validation**: Zod
- **Auth**: JWT (HTTP-only cookie)
- **Testing**: Vitest + Supertest

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

---

### Mail service setup

The backend is split logically into:

- **User service** (this repo’s `backend/user`) — owns auth, user CRUD, publishes OTP email jobs.
- **Mail service** — a separate worker that listens to RabbitMQ and actually sends emails.

Mail flow:

1. `POST /api/v1/auth/login`:
   - Generates an OTP.
   - Stores it in Redis with TTL.
   - Publishes a message to RabbitMQ:
     - Queue: `send-mail`
     - Payload: `{ to, subject, body }` where `body` contains the OTP.
2. **Mail worker**:
   - Connects to the same RabbitMQ instance.
   - Consumes messages from `send-mail`.
   - Uses your SMTP provider (`nodemailer`, SES, etc.) to send the email.

To run the mail worker you need:

- Access to RabbitMQ with the same `RABBIT_MQ_*` env vars.
- A small Node.js process that:
  - Uses `amqplib` to `connect`, `createChannel`, and `consume("send-mail", handler)`.
  - Parses the message and sends the email with your SMTP credentials.

This README focuses on the **user service**; the **mail worker** can live in a separate repo or folder, as long as it shares the same RabbitMQ config.

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

In `backend/user`, copy `.env.example` to `.env` and adjust values:

```bash
cp backend/user/.env.example backend/user/.env
```

The main variables:

- **Core**
  - `PORT` – port for the user service (e.g. `3001`)
  - `MONGODB_URL` – Mongo connection string
  - `JWT_SECRET` – secret for signing JWTs
  - `SECRET_KEY` – symmetric key for field-level encryption
  - `CORS_ORIGIN` – allowed frontend origin
- **Redis**
  - `REDIS_URL` – Redis connection string (OTP + rate limiting)
- **RabbitMQ (mail service)**
  - `RABBIT_MQ_HOST` – RabbitMQ host
  - `RABBIT_MQ_USER` – RabbitMQ username
  - `RABBIT_MQ_PASSWORD` – RabbitMQ password
  - `RABBIT_MQ_VHOST` – RabbitMQ vhost to use

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

The service will start on `http://localhost:${PORT}` (default `5001`).

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


