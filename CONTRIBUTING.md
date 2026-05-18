# Contributing to Voyage

## Repository layout

```
apps/mobile/   React Native / Expo frontend
apps/api/      Spring Boot API
infra/         Docker and deployment config
scripts/       Developer convenience scripts
docs/          Architecture and reference docs
```

## First-time setup

```bash
bash scripts/setup.sh
```

This copies `.env.example` files, runs `npm ci`, and prepares the backend config template. You still need to fill in your JWT secret and (optionally) Google Client ID in `apps/api/src/main/resources/application.properties`.

## Running the apps

```bash
# API (from apps/api/)
mvn clean spring-boot:run -DskipTests

# Mobile (from apps/mobile/)
npx expo start --clear
```

Or use the convenience script:

```bash
bash scripts/dev-api.sh   # starts API with H2 dev DB
```

## Branch naming

```
feature/short-description
fix/short-description
chore/short-description
```

Target `master` for all PRs.

## Tests

```bash
# All backend tests
cd apps/api && mvn test

# Single test class
mvn test -Dtest=BalanceServiceTest

# Single method
mvn test -Dtest=BalanceServiceTest#shouldSettleDebtsCorrectly
```

There are no frontend test scripts configured yet.

## Key conventions

- **Money is always integer cents.** Never use floats for monetary values. Only call `formatCurrency` at UI display boundaries.
- **No Lombok** in the backend — hand-write getters and setters.
- **No secrets in code.** The gitleaks pre-commit hook will block any commit containing a detected secret. If you need to add a new secret, add it to `application.properties` (gitignored) and document the variable name in `application.properties.example`.
- **Bump `SCHEMA_VERSION`** in `apps/mobile/src/services/dbService.js` whenever you change the SQLite schema — this triggers a local DB rebuild on app start.

## Security

- Never commit `application.properties` or any `.env` file.
- Do not bypass the pre-commit hook (`git commit --no-verify`) unless you are certain the finding is a false positive, and add a `.gitleaksignore` entry instead.
- See `docs/security.md` for the secret rotation procedure.
