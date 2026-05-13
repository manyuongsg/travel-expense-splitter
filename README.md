# Voyage

> Stop chasing friends for money. Track every trip expense, settle debts in seconds, and see exactly where the group's money went.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
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
| --- | --- |
| Mobile | React Native 0.81.5 + Expo SDK 54 |
| Navigation | React Navigation v7 (tabs + stack) |
| UI | React Native Paper 5.13.1 |
| Backend | Spring Boot 3.2.5 (Java 17) |
| Auth | JWT + Google OAuth 2.0 |
| Database | H2 (dev) / PostgreSQL (prod) |
| Offline | SQLite via expo-sqlite 16 |

---

## Getting Started

### Prerequisites

| Tool | Version | Download |
| --- | --- | --- |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Java JDK | 17 | [adoptium.net](https://adoptium.net) |
| Maven | 3.8+ | [maven.apache.org](https://maven.apache.org) |
| Expo Go | latest | Play Store / App Store |

### Installation & Setup

#### 1. Clone the repository

```bash
git clone https://github.com/your_username/travel-expense-splitter.git
cd travel-expense-splitter
```

#### 2. Backend setup

```bash
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Generate a JWT secret and paste it into `application.properties`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

```properties
app.jwt.secret=PASTE_YOUR_GENERATED_SECRET_HERE
```

Start the backend:

```bash
mvn clean spring-boot:run -DskipTests
```

The API runs on `http://localhost:8080`. H2 console at `http://localhost:8080/h2-console`.

#### 3. Frontend setup

Open a new terminal at the project root:

```bash
npm install
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone, or press `a` for an Android emulator.

> **Physical device:** the app auto-resolves the backend URL from Expo's dev server `hostUri` — no manual IP configuration needed on the same LAN.

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

| Method | Path                  | Description            |
|--------|-----------------------|------------------------|
| POST   | `/register`           | Create account         |
| POST   | `/login`              | Email/password login   |
| POST   | `/google`             | Google ID token sign-in|
| POST   | `/refresh`            | Refresh JWT            |
| PATCH  | `/profile`            | Update display name    |
| POST   | `/change-password`    | Change password        |
| DELETE | `/account`            | Delete account         |

#### Trips — `/api/trips`

| Method | Path                            | Description                       |
|--------|---------------------------------|-----------------------------------|
| GET    | `/`                             | List active trips                 |
| GET    | `/archived`                     | List archived trips               |
| GET    | `/{tripId}`                     | Get trip with members             |
| POST   | `/`                             | Create trip                       |
| PATCH  | `/{tripId}`                     | Update trip                       |
| PATCH  | `/{tripId}/archive`             | Archive / unarchive               |
| DELETE | `/{tripId}`                     | Delete trip                       |
| POST   | `/{tripId}/members`             | Add member                        |
| DELETE | `/{tripId}/members/{memberId}`  | Remove member                     |
| GET    | `/{tripId}/balances`            | Compute balances & settlements    |

#### Expenses — `/api/trips/{tripId}/expenses`

| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | `/`               | List expenses    |
| POST   | `/`               | Create expense   |
| PUT    | `/{expenseId}`    | Update expense   |
| DELETE | `/{expenseId}`    | Delete expense   |

#### Exchange Rates — `/api/exchange-rates`

| Method | Path                          | Description       |
|--------|-------------------------------|-------------------|
| GET    | `/?base=USD&targets=SGD,EUR`  | Fetch live rates  |

---

## Project Structure

```text
travel-expense-splitter/
├── src/
│   ├── context/          # Auth state (AuthContext)
│   ├── navigation/       # Tab + stack navigator (AppNavigator)
│   ├── screens/
│   │   ├── auth/         # SplashScreen, LoginScreen, RegisterScreen
│   │   ├── dashboard/    # DashboardScreen (home overview)
│   │   ├── trips/        # TripListScreen, TripDetailScreen, CreateTripScreen, EditTripScreen
│   │   ├── expenses/     # AddExpenseScreen, EditExpenseScreen
│   │   ├── balances/     # BalanceScreen, AccountManagementScreen
│   │   ├── insights/     # InsightsScreen (Almanac)
│   │   ├── activity/     # ActivityScreen (Dispatches feed)
│   │   └── scan/         # ReceiptScanScreen
│   ├── services/         # api.js, authService, expenseService, tripService, dbService (SQLite)
│   ├── components/       # PostageElements (SVG/styled), CategoryPieChart
│   ├── theme/            # postage.js — colors, fonts, category definitions
│   └── utils/            # currency, dateUtils, countries, states, authEvents
└── backend/
    └── src/main/java/com/voyage/
        ├── controller/   # AuthController, TripController, ExpenseController, ExchangeRateController
        ├── service/      # Business logic
        ├── entity/       # JPA entities (User, Trip, TripMember, Expense, ExpenseSplit)
        ├── dto/          # Request/response objects
        ├── repository/   # Spring Data JPA interfaces
        ├── security/     # JwtAuthFilter, JwtService, UserDetailsServiceImpl
        └── config/       # SecurityConfig
```

> **Key conventions:**
>
> - All monetary values are **integer cents** end-to-end. Only convert at display boundaries via `formatCurrency` in [src/utils/currency.js](src/utils/currency.js).
> - Backend uses manual getters/setters — Lombok is not used.
> - To change the SQLite schema, bump `SCHEMA_VERSION` in [src/services/dbService.js](src/services/dbService.js) (currently v3).

---

## Windows Development Notes

Metro bundler patches are applied automatically on `npm install` via `patch-package`.

### EBUSY / file lock errors

1. Kill stale Node processes: `taskkill /f /im node.exe`
2. Restart with a clean cache: `npx expo start --clear`
3. Start the backend **before** Expo to reduce disk contention
4. Optionally disable Windows Search indexer:

```powershell
Stop-Service -Name wsearch -Force
Set-Service -Name wsearch -StartupType Disabled
```

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
