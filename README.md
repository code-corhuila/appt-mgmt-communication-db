# appt-mgmt-communication-db

MongoDB schema, migrations, and development fixtures for Salud Activa's communication service.
The schema is aligned with [`appt-mgmt-communication-api`](https://github.com/code-corhuila/appt-mgmt-communication-api):

```text
messages: _id, senderId, recipientId, content, createdAt, readAt
```

`senderId` and `recipientId` are user ID strings from the shared JWT; this database owns messages
only and does not duplicate user records. Message bodies are limited to 2,000 characters.

## Local setup

Requires Node.js 22+ and Docker Compose.

```powershell
Copy-Item .env.example .env
npm ci
npm test
docker compose up --build
```

Compose starts MongoDB and runs pending migrations. Set `MONGODB_URI` in `.env` to run a migration
from the host:

```powershell
npm run migrate
```

Migrations are ordered, tracked in `schema_migrations`, and safe to rerun. Applied migrations are
not edited; make a new numbered migration for subsequent schema changes. The first migration
creates/updates the collection validator and the indexes used by the API's conversation queries.

## Development-only seed data

The fixture uses synthetic demo IDs and messages. It is idempotent and refuses to run unless
`NODE_ENV=development`:

```powershell
$env:NODE_ENV = "development"
npm run seed:dev
```

With Compose, run `docker compose --profile seed run --rm seed`. Never use the development seed
against shared or production databases.

## Validation and CI

`npm test` checks the message schema, indexes, migration behavior, and migration ledger without
requiring a running database. GitHub Actions runs tests and validates Compose on pull requests
targeting `develop`, `qa`, or `main` and on development branch pushes.

## Branching

Changes enter through child branches and pull requests:

```
hu-xxx-dev -> PR develop -> PR qa -> PR main
```

Do not commit directly to permanent environment branches. Promotion follows the team repository
policy; `main` requires approval from `ariel5253`. Governance details are in
[`library-docs`](https://github.com/code-corhuila/library-docs).
