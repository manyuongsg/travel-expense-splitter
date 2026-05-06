# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Split and Share** — a travel expense splitter. React Native (Expo) mobile app with a Spring Boot REST API backend.

## Commands

### Frontend (React Native / Expo)

```bash
# Start Expo dev server
npx expo start

# Run on Android emulator
npx expo run:android

# Run on iOS simulator
npx expo run:ios
```

### Backend (Spring Boot / Maven)

```bash
cd backend

# Build and run (development)
mvn clean spring-boot:run

# Build only
mvn clean package -DskipTests

# Run tests
mvn test
```

The backend runs on `http://localhost:8080`. H2 console available at `http://localhost:8080/h2-console`.

### Command Definition

name: test-and-fix

description: Run full test suite, fix errors, lint

steps:



## Architecture

### Backend (`backend/`)

Spring Boot 3.2.5 / Java 17 / H2 (dev) or PostgreSQL (prod).

**Important:** Lombok is listed in `pom.xml` but **does not work** in this setup — annotation processing was never configured correctly. All entities use manual getter/setter methods and static inner `Builder` classes. All DTOs use all-args constructors. Do not add `@Getter`, `@Setter`, `@Builder`, etc.

**Layer structure:**
- `entity/` — JPA entities: `User`, `Trip`, `TripMember`, `Expense`, `ExpenseSplit`
- `dto/` — Request/response objects (no Lombok)
- `repository/` — Spring Data JPA interfaces
- `service/` — Business logic
- `controller/` — REST endpoints under `/api/`
- `security/` — JWT filter (`JwtAuthFilter`), `JwtService`, `UserDetailsServiceImpl`
- `config/SecurityConfig` — Spring Security 6 filter chain

**Key domain model:**
- `Trip` is owned by a `User` (createdBy) and has a list of `TripMember` (name-only, no account required)
- `TripMember` is a lightweight entity (id + name) scoped to a trip — not linked to `User`
- `Expense` references a `TripMember` as paidBy; `ExpenseSplit` references `TripMember` as owedBy
- Authorization is creator-only: only the `Trip.createdBy` user can add members or create expenses

**Authentication:** JWT (`app.jwt.secret` in `application.properties`). Access token (1 hr) + refresh token (7 days) stored in `expo-secure-store` on the client.

### Frontend (`src/`)

React Native 0.76.9 / Expo SDK 52. No TypeScript.

**Key files:**
- `src/navigation/AppNavigator.js` — Navigation tree: `AuthStack` (Login/Register) or `AppStack` (tabs + modals) based on `AuthContext`
- `src/context/AuthContext.js` — Global auth state; user object persisted to SecureStore
- `src/services/api.js` — Axios instance with JWT injection and auto-refresh on 401. **Base URL is `http://10.0.2.2:8080/api`** (Android emulator localhost). Change to your machine's LAN IP for physical devices.
- `src/services/dbService.js` — SQLite offline cache via `expo-sqlite`. Schema versioned with `PRAGMA user_version`; bump `SCHEMA_VERSION` constant to wipe and recreate all tables when the schema changes.
- `src/utils/currency.js` — All monetary values are **integer cents** throughout the stack. Only convert at UI boundaries using `dollarsToCents` / `formatCurrency`.

**Screen → backend flow for expenses:**
1. `TripDetailScreen` fetches trip + expenses, caches both to SQLite
2. FAB navigates to `AddExpenseScreen` passing `{ tripId, members, currency }` via route params — `members` is the `TripMember` list (each has `{ id, name }`)
3. `AddExpenseScreen` posts to `expenseService.create(tripId, payload)` where `paidByMemberId` is a `TripMember.id`
4. On network failure, expense is saved locally and queued in `pending_sync` table

**Offline support:** `dbService.queueSync()` stores pending operations. Sync replay is not yet implemented — items accumulate in `pending_sync`.

**Friends tab:** Derived from trip member names across all trips, deduplicated by lowercase name. No direct friend relationship model exists.

### Database schema (SQLite — frontend)

```
trips(id, name, base_currency, created_at, synced)
trip_members(member_id PK, trip_id, name)
expenses(id, trip_id, description, amount_cents, currency, exchange_rate, paid_by_member_id, created_at, synced)
expense_splits(id, expense_id, member_id, amount_cents, settled)
pending_sync(id, entity_type, entity_id, operation, payload, created_at)
```

Column names in SQLite use `snake_case`; the JS service layer maps between `camelCase` (API/state) and `snake_case` (SQLite rows).
