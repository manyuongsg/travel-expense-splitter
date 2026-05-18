# Voyage

> Stop chasing friends for money. Track every trip expense, settle debts in seconds, and see exactly where the group's money went.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen?logo=springboot)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black?logo=expo)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Demo

> Add screenshots or a screen recording here. Suggested screens to capture:
>
> - Dashboard with recent trips and outstanding balances
> - Add expense form with category glyphs and currency toggle
> - Settle Up view with money-order style transfer cards
> - Almanac insights with the category donut chart
> - Activity feed (Dispatches) timeline
> - Receipt scanner with parsed result sheet

---

## Key Features

- **Multi-currency expenses** — log any expense in any currency with live exchange rate conversion to your home currency.
- **Automatic debt settlement** — greedy algorithm calculates the minimum number of transfers to settle the group's balance.
- **Spending insights (Almanac)** — category donut chart, per-member spending bar chart, and daily spend trend.
- **Activity feed** — chronological timeline of all expenses and settlements per trip.
- **Receipt scanner** — scan a receipt to auto-fill the expense form with merchant, amount, and category.
- **Offline-first** — full balance computation works without a connection; changes queue locally and sync when back online.
- **Google Sign-In** — server-side verified OAuth 2.0 alongside email/password auth.
- **Voyage · Postage design** — cohesive editorial theme with serif headings, monospace labels, perforated stamp borders, and SVG postmarks.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81.5 + Expo SDK 54 |
| Navigation | React Navigation v7 (tabs + stack) |
| UI | React Native Paper 5.13.1 |
| Backend | Spring Boot 3.2.5 (Java 21) |
| Auth | JWT + Google OAuth 2.0 |
| Database | H2 (dev) / PostgreSQL (prod) |
| Offline | SQLite via expo-sqlite 16 |

---

## Repository Layout

```
travel-expense-splitter/
├── apps/
│   ├── mobile/          # React Native / Expo frontend
│   └── api/             # Spring Boot REST API
├── infra/
│   ├── docker/          # Dockerfiles
│   ├── docker-compose.yml          # Local dev stack (PostgreSQL + API)
│   └── docker-compose.ci.yml       # CI stack
├── docs/                # Architecture, API reference, security policy
├── scripts/
│   ├── setup.sh         # One-command dev bootstrap
│   ├── dev-api.sh       # Start API with H2 dev DB
│   └── check-secrets.sh # Manual secret scan
├── .github/
│   ├── workflows/       # ci-api.yml, ci-mobile.yml, codeql.yml
│   └── ISSUE_TEMPLATE/
├── CONTRIBUTING.md
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Java JDK | 21 | [adoptium.net](https://adoptium.net) |
| Maven | 3.8+ | [maven.apache.org](https://maven.apache.org) |
| Expo Go | latest | Play Store / App Store |

### Option A — One-command setup

```bash
git clone https://github.com/manyuongsg/travel-expense-splitter.git
cd travel-expense-splitter
bash scripts/setup.sh
```

The script copies both `.env.example` files, runs `npm ci`, and prepares the backend config template. Then follow the prompts to fill in your secrets (see [Backend secrets](#backend-secrets) below).

### Option B — Manual setup

#### 1. Clone

```bash
git clone https://github.com/manyuongsg/travel-expense-splitter.git
cd travel-expense-splitter
```

#### 2. Backend

```bash
cd apps/api
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties
```

Open `application.properties` and set `VOYAGE_JWT_SECRET`. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
# or
openssl rand -base64 64
```

Then set it as an environment variable before starting, or paste the value directly into `application.properties` for local dev only (the file is gitignored):

```properties
app.jwt.secret=YOUR_GENERATED_SECRET_HERE
```

Start the API:

```bash
mvn clean spring-boot:run -DskipTests
```

The API runs on `http://localhost:8080`. H2 console at `http://localhost:8080/h2-console`.

#### 3. Mobile

Open a new terminal:

```bash
cd apps/mobile
cp .env.example .env          # fill in EXPO_PUBLIC_GOOGLE_CLIENT_ID if using Google login
npm install
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone, or press `a` for an Android emulator.

> **Physical device:** the app auto-resolves the backend URL from Expo's `hostUri` — no manual IP configuration needed on the same LAN.

---

## Backend Secrets

`apps/api/src/main/resources/application.properties` is gitignored and must never be committed. All sensitive values it references:

| Variable | Required | Description |
|---|---|---|
| `app.jwt.secret` | Yes | Base64 string, min 64 bytes decoded. Used to sign JWTs. |
| `app.google.client-id` | No | Web Client ID from Google Cloud Console. Only needed if using Google Sign-In. |

For production or Docker deployments, pass these as environment variables (`VOYAGE_JWT_SECRET`, `APP_GOOGLE_CLIENT_ID`) — see `infra/docker-compose.yml`.

---

## Usage

### Register and create a trip

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret","displayName":"Alex"}'

# Login — copy the accessToken from the response
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret"}'

# Create a trip
curl -X POST http://localhost:8080/api/trips \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tokyo 2025","baseCurrency":"JPY","homeCurrency":"USD"}'
```

### Add an expense and check balances

```bash
# Add an expense (tripId and paidByMemberId from previous responses)
curl -X POST http://localhost:8080/api/trips/{tripId}/expenses \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Ramen dinner",
    "amountCents": 450000,
    "currency": "JPY",
    "exchangeRate": 0.0067,
    "paidByMemberId": 1,
    "category": "FOOD",
    "splits": [{"memberId": 1}, {"memberId": 2}]
  }'

# Get settlement plan
curl http://localhost:8080/api/trips/{tripId}/balances \
  -H "Authorization: Bearer <accessToken>"
```

### Full API Reference

#### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Email/password login |
| POST | `/google` | Google ID token sign-in |
| POST | `/refresh` | Refresh JWT |
| PATCH | `/profile` | Update display name |
| POST | `/change-password` | Change password |
| DELETE | `/account` | Delete account |

#### Trips — `/api/trips`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List active trips |
| GET | `/archived` | List archived trips |
| GET | `/{tripId}` | Get trip with members |
| POST | `/` | Create trip |
| PATCH | `/{tripId}` | Update trip |
| PATCH | `/{tripId}/archive` | Archive / unarchive |
| DELETE | `/{tripId}` | Delete trip |
| POST | `/{tripId}/members` | Add member |
| DELETE | `/{tripId}/members/{memberId}` | Remove member |
| GET | `/{tripId}/balances` | Compute balances & settlements |

#### Expenses — `/api/trips/{tripId}/expenses`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List expenses |
| POST | `/` | Create expense |
| PUT | `/{expenseId}` | Update expense |
| DELETE | `/{expenseId}` | Delete expense |

#### Exchange Rates — `/api/exchange-rates`

| Method | Path | Description |
|---|---|---|
| GET | `/?base=USD&targets=SGD,EUR` | Fetch live rates |

---

## Key Conventions

- **Money is always integer cents.** Never use floats for monetary values anywhere in the stack. Only convert at UI display boundaries via `formatCurrency` in [`apps/mobile/src/utils/currency.js`](apps/mobile/src/utils/currency.js).
- **No Lombok** in the backend — all entities use hand-written getters and setters.
- **SQLite schema versioning** — bump `SCHEMA_VERSION` in [`apps/mobile/src/services/dbService.js`](apps/mobile/src/services/dbService.js) whenever the local schema changes. The app drops and recreates all tables on next launch if the version is stale.
- **No secrets in source control** — a gitleaks pre-commit hook blocks any commit containing a detected credential. See [CONTRIBUTING.md](CONTRIBUTING.md) for the bypass procedure.

---

## Windows Development Notes

Metro bundler patches are applied automatically on `npm install` via `patch-package`.

### EBUSY / file lock errors

```powershell
taskkill /f /im node.exe          # kill stale Node processes
cd apps/mobile
npx expo start --clear            # restart with clean cache
```

Other mitigations:
- Start the backend **before** Expo to reduce disk contention.
- Optionally disable Windows Search indexer on the project directory.

```powershell
Stop-Service -Name wsearch -Force
Set-Service -Name wsearch -StartupType Disabled
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, test commands, and the security checklist.

---

## Roadmap

- [ ] Full offline sync — replay `pending_sync` queue on reconnect
- [ ] Push notifications for pending settlements
- [ ] Export trip report as PDF / shareable summary
- [ ] Real camera integration for receipt scanning (currently simulated)
- [ ] Dark mode

---

## License & Contact

**License:** [MIT](LICENSE)

**Contact:** [manyuong.sg@gmail.com](mailto:manyuong.sg@gmail.com)
