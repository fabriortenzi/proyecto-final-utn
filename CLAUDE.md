# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeliverIt is a fullstack online ordering app (similar to PedidosYa) built as a university project. Four roles: customer, owner, delivery, admin.

- **Backend**: `Back-end App/` — Express.js + TypeScript + MikroORM + MongoDB
- **Frontend**: `Front-end App/DeliverItAngularProject/` — Angular 16 + Angular Material + SCSS
- **Requirements**: Node.js 20+, MongoDB 7+

## Commands

### Backend (`cd "Back-end App"`)

```bash
npm run start:dev          # Dev server with tsc-watch auto-reload
npm run start:prod         # Compile TS + run production
npm run test               # Compile TS + run Jest (unit + integration tests via Supertest)
```

Note: `npm run test` uses `tsc-watch` which recompiles and then runs Jest with `--detectOpenHandles`. Tests require a running MongoDB instance and valid `.env.development` with `DB_URL` and `JWT_SECRET_KEY`.

Jest config: `jestconfig.json` — matches `**/**/*.test.js` from compiled `dist/` output. Setup file: `dist/__tests__/setupTests.ts`.

### Frontend (`cd "Front-end App/DeliverItAngularProject"`)

```bash
npm start                  # ng serve (dev server with hot reload)
npm run build              # ng build (production)
npm run test               # Jest unit tests (currently hardcoded to review.component.spec.ts)
npm run test:watch         # Jest watch mode
npm run test:coverage      # Jest coverage report
npm run cy:open            # Cypress E2E interactive
```

### Docker (project root)

```bash
docker compose up --build  # Start all services (MongoDB + Backend + Frontend)
docker compose down        # Stop all services
docker compose down -v     # Stop all services and remove volumes
```

Services: MongoDB on `localhost:27017`, Backend on `localhost:3000`, Frontend on `localhost:4200`. Hot-reload enabled for both backend (`tsc-watch`) and frontend (`ng serve`).

## Architecture

### Backend Structure (`Back-end App/src/`)

Domain-driven modules, each with `entity.ts`, `controller.ts`, `routes.ts`:

- **Domains**: `user/`, `shop/`, `product/`, `order/`, `lineItem/`, `review/`, `commission/`, `paymentType/`, `productCategory/`, `productVariation/`, `withdrawal/`, `userType/`, `shopType/`
- **Shared**: `shared/` — ORM init (`orm.ts`), JWT auth middleware (`auth.middleware.ts`), input validation (`validator.ts`), image upload (`imageHandler.ts`), base entity
- **Entry point**: `app.ts` → `appConfig.ts` (Express setup + route mounting)
- **API docs**: Swagger at `/api-docs`
- **Tests**: `__tests__/integrationTests.test.ts` and `unitTests.test.ts`

**Middleware chain**: CORS → JSON parser → Cookie parser → MikroORM RequestContext → Routes (sanitization → auth → validation → controller)

**Auth flow**: JWT via `Authorization: Bearer <token>`. Middleware `assureAuthAndRoles(roles: UserTypeEnum[])` verifies token and checks role. Roles defined in `UserTypeEnum`: `client`, `admin`, `delivery`, `owner`.

**ORM**: MikroORM 5.9 with MongoDB driver. Entities use decorators (`@Entity`, `@Property`, `@ManyToOne`, `@OneToMany`). `@Filter` decorators for complex queries on Order entity. No explicit migrations — schema synced automatically.

### Frontend Structure (`Front-end App/DeliverItAngularProject/src/app/`)

Single `AppModule` with 67+ components. Key patterns:

- **Services**: Typed HTTP services per resource, `BaseUrlService` for API URL config
- **Auth**: `AuthInterceptor` injects Bearer token from `sessionStorage`. `AuthGuard` checks token + role for route protection.
- **Routing**: `app-routing.module.ts` with role-based guards
- **UI**: Angular Material + Bootstrap 3.4 + custom shared components (buttons, cards, error panels)
- **State**: Component-level state + sessionStorage for auth (no NgRx/centralized store)

### API Routes

All prefixed with `/api/`: `shopTypes`, `paymentTypes`, `productCategories`, `commissions`, `userTypes`, `user`, `products`, `shops`, `order`, `withdrawal`, `productVariations`, `reviews`

## Environment Variables (Backend)

Loaded via `--env-file` flag (not dotenv at runtime). Files: `.env.development`, `.env.production`. Required vars:
- `DB_URL` — MongoDB connection string
- `JWT_SECRET_KEY` — Secret for signing JWTs

## Key Conventions

- ESM modules (`"type": "module"` in backend package.json) — all imports use `.js` extension even for `.ts` source files
- Controllers sanitize input with allowlist approach (manually picking known properties)
- Image uploads: Multer to local `src/shared/assets/`, JPEG only
- Backend test pattern: login first to obtain JWT, then test endpoints with `Authorization` header via Supertest
- No linter or formatter configured
