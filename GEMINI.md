# Project Overview

This is a barbershop API built with Node.js, Fastify, and Prisma. It uses a MySQL database and is designed to be run with Docker.

**Main Technologies:**

*   **Backend:** Node.js, Fastify, TypeScript
*   **ORM:** Prisma
*   **Database:** MySQL
*   **Testing:** Vitest
*   **Linting:** ESLint
*   **Build Tool:** tsup

**Architecture:**

The project follows a modular architecture, with routes, services, and repositories separated by feature. The database schema is defined in `prisma/schema.prisma`. The main application entry point is `src/app.ts`, which registers all the Fastify routes and middleware.

# Building and Running

**Prerequisites:**

*   Node.js >= 20.19.0
*   Docker

**Development:**

1.  Create a `.env` file from the `.env.example` file and update the environment variables.
2.  Run `docker compose up` to start the development server and database.
3.  The API will be available at `http://localhost:3333`.

**Production:**

1.  Run `npm run build` to build the project.
2.  Run `npm run start` to start the production server.

**Testing:**

*   `npm test`: Run all tests.
*   `npm run lint`: Lint the code.
*   `npm run typecheck`: Type-check the code.

# Development Conventions

*   **Coding Style:** The project uses ESLint with the `@rocketseat/eslint-config` to enforce a consistent coding style.
*   **Testing:** Tests are written with Vitest and are located in the `test` directory.
*   **Commits:** There are no explicit commit conventions, but the project uses `git` for version control.
