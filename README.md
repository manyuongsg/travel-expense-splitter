# Split and Share

A travel expense splitter mobile app. Create trips, add expenses, and automatically calculate who owes whom — with offline support and real-time sync.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.76 + Expo SDK 52 |
| Navigation | React Navigation v7 |
| Backend | Spring Boot 3.2.5 (Java 17) |
| Auth | JWT + Google OAuth |
| Database | H2 (dev) / PostgreSQL (prod) |
| Offline | SQLite via expo-sqlite |

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org |
| Expo Go | latest | Play Store / App Store |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your_username/travel-expense-splitter.git
cd travel-expense-splitter
```

### 2. Backend setup

```bash
cd backend
```

Open `src/main/resources/application.properties` and replace the two `TODO` values:

```properties
# Generate one with: openssl rand -base64 64
app.jwt.secret=REPLACE_WITH_YOUR_JWT_SECRET

# Only needed if using Google login
app.google.client-id=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
```

Start the backend:

```bash
mvn clean spring-boot:run -DskipTests
```

The API runs on `http://localhost:8080`.  
H2 console available at `http://localhost:8080/h2-console`.

### 3. Frontend setup

Open a new terminal in the project root:

```bash
npm install
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone, or press `a` to open on an Android emulator.

> **Physical device:** update `API_BASE_URL` in `src/services/api.js` to your machine's local IP address (e.g. `http://192.168.1.x:8080/api`).  
> **Android emulator:** keep it as `http://10.0.2.2:8080/api` (default).

---

## Project Structure

```
travel-expense-splitter/
├── src/
│   ├── context/          # Auth state (AuthContext)
│   ├── navigation/       # App navigator (tabs + stacks)
│   ├── screens/          # UI screens grouped by feature
│   │   ├── auth/         # Login, Register
│   │   ├── trips/        # Trip list, detail, create
│   │   ├── expenses/     # Add expense
│   │   ├── balances/     # Balance summary, settlements
│   │   └── friends/      # Friends derived from trip members
│   ├── services/         # API calls and SQLite offline cache
│   ├── theme/            # Shared styles
│   └── utils/            # Currency helpers (integer cents)
├── backend/
│   └── src/main/java/com/splitandshare/
│       ├── controller/   # REST endpoints (/api/*)
│       ├── service/      # Business logic
│       ├── entity/       # JPA entities (User, Trip, Expense, etc.)
│       ├── dto/          # Request/response objects
│       ├── repository/   # Spring Data JPA interfaces
│       ├── security/     # JWT filter, JwtService
│       └── config/       # Spring Security config
├── assets/               # App icons and splash screen
├── patches/              # patch-package fixes for Metro (Windows)
├── App.js                # Root component
└── app.json              # Expo config
```

---

## Key Notes

- All monetary values are stored as **integer cents** throughout the stack. Use `formatCurrency` from `src/utils/currency.js` at display boundaries only.
- The backend uses **manual getters/setters** — Lombok is not used.
- Offline expenses are queued in SQLite (`pending_sync` table) and replayed on reconnect.
- If you change the SQLite schema, bump `SCHEMA_VERSION` in `src/services/dbService.js` to wipe and recreate tables.

---

## Windows Development Notes

This project includes `patches/` for Metro bundler fixes on Windows. They are applied automatically on `npm install` via `patch-package`. If you see `EBUSY` errors on startup, see the troubleshooting steps below.

<details>
<summary>EBUSY / file lock errors on Windows</summary>

1. Kill stale Node processes: `taskkill /f /im node.exe`
2. Clear cache and restart: `npx expo start --clear`
3. Start the backend **before** Expo to reduce disk contention
4. Optionally disable Windows Search indexer (known cause):
   ```powershell
   Stop-Service -Name wsearch -Force
   Set-Service -Name wsearch -StartupType Disabled
   ```

</details>
