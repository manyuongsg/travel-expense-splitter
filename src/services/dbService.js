import * as SQLite from 'expo-sqlite';

let db = null;

const SCHEMA_VERSION = 3;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('splitandshare.db');
    await _initSchema();
  }
  return db;
}

async function _initSchema() {
  // Bump SCHEMA_VERSION above to wipe and recreate all tables when schema changes
  const row = await db.getFirstAsync('PRAGMA user_version');
  if (row.user_version < SCHEMA_VERSION) {
    await db.execAsync(`
      DROP TABLE IF EXISTS settled_settlements;
      DROP TABLE IF EXISTS expense_splits;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS trip_members;
      DROP TABLE IF EXISTS trips;
      DROP TABLE IF EXISTS pending_sync;
    `);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_currency TEXT NOT NULL DEFAULT 'SGD',
      home_currency TEXT NOT NULL DEFAULT 'SGD',
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      member_id TEXT NOT NULL,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      PRIMARY KEY (member_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      exchange_rate TEXT NOT NULL DEFAULT '1.0000',
      paid_by_member_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      settled INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settled_settlements (
      trip_id TEXT NOT NULL,
      from_name TEXT NOT NULL,
      to_name TEXT NOT NULL,
      PRIMARY KEY (trip_id, from_name, to_name)
    );
  `);
}

// --- Trips ---

export const dbService = {
  saveTrip: async (trip) => {
    const database = await getDb();
    await database.runAsync(
      `INSERT OR REPLACE INTO trips (id, name, base_currency, home_currency, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trip.id, trip.name, trip.baseCurrency, trip.homeCurrency ?? 'SGD', trip.createdAt, 1]
    );
  },

  getAllTrips: async () => {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM trips ORDER BY created_at DESC');
  },

  saveTripMembers: async (tripId, members) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM trip_members WHERE trip_id = ?', [tripId]);
    for (const m of members) {
      await database.runAsync(
        `INSERT OR REPLACE INTO trip_members (member_id, trip_id, name)
         VALUES (?, ?, ?)`,
        [m.id, tripId, m.name]
      );
    }
  },

  getTripMembers: async (tripId) => {
    const database = await getDb();
    return await database.getAllAsync(
      'SELECT * FROM trip_members WHERE trip_id = ?', [tripId]
    );
  },

  saveExpense: async (expense) => {
    const database = await getDb();
    await database.runAsync(
      `INSERT OR REPLACE INTO expenses
         (id, trip_id, description, amount_cents, currency, exchange_rate, paid_by_member_id, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id, expense.tripId, expense.description,
        expense.amountCents, expense.currency,
        String(expense.exchangeRate ?? '1.0000'),
        expense.paidByMemberId, expense.createdAt, 1,
      ]
    );
    if (expense.splits) {
      await database.runAsync('DELETE FROM expense_splits WHERE expense_id = ?', [expense.id]);
      for (const s of expense.splits) {
        await database.runAsync(
          `INSERT INTO expense_splits (id, expense_id, member_id, amount_cents, settled)
           VALUES (?, ?, ?, ?, ?)`,
          [s.id, expense.id, s.memberId, s.amountCents, s.settled ? 1 : 0]
        );
      }
    }
  },

  getExpensesForTrip: async (tripId) => {
    const database = await getDb();
    const expenses = await database.getAllAsync(
      'SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC', [tripId]
    );
    for (const exp of expenses) {
      exp.splits = await database.getAllAsync(
        'SELECT * FROM expense_splits WHERE expense_id = ?', [exp.id]
      );
    }
    return expenses;
  },

  computeLocalBalances: async (tripId) => {
    const expenses = await dbService.getExpensesForTrip(tripId);
    const members = await dbService.getTripMembers(tripId);
    const net = {};
    for (const m of members) net[m.member_id] = 0;

    for (const exp of expenses) {
      net[exp.paid_by_member_id] = (net[exp.paid_by_member_id] ?? 0) + exp.amount_cents;
      for (const split of exp.splits) {
        net[split.member_id] = (net[split.member_id] ?? 0) - split.amount_cents;
      }
    }

    const creditors = [], debtors = [];
    for (const [memberId, balance] of Object.entries(net)) {
      const member = members.find((m) => m.member_id === memberId);
      const name = member?.name ?? memberId;
      if (balance > 0) creditors.push({ memberId, name, amount: balance });
      else if (balance < 0) debtors.push({ memberId, name, amount: -balance });
    }

    const settlements = [];
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const credit = creditors[ci];
      const debt = debtors[di];
      const amount = Math.min(credit.amount, debt.amount);
      settlements.push({ fromName: debt.name, toName: credit.name, amountCents: amount });
      credit.amount -= amount;
      debt.amount -= amount;
      if (credit.amount === 0) ci++;
      if (debt.amount === 0) di++;
    }
    return settlements;
  },

  getSettledSettlements: async (tripId) => {
    const database = await getDb();
    const rows = await database.getAllAsync(
      'SELECT from_name, to_name FROM settled_settlements WHERE trip_id = ?',
      [tripId]
    );
    return new Set(rows.map((r) => `${r.from_name}|${r.to_name}`));
  },

  toggleSettlement: async (tripId, fromName, toName, markAsSettled) => {
    const database = await getDb();
    if (markAsSettled) {
      await database.runAsync(
        'INSERT OR REPLACE INTO settled_settlements (trip_id, from_name, to_name) VALUES (?, ?, ?)',
        [tripId, fromName, toName]
      );
    } else {
      await database.runAsync(
        'DELETE FROM settled_settlements WHERE trip_id = ? AND from_name = ? AND to_name = ?',
        [tripId, fromName, toName]
      );
    }
  },

  queueSync: async (entityType, entityId, operation, payload) => {
    const database = await getDb();
    await database.runAsync(
      `INSERT INTO pending_sync (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `${entityType}_${entityId}_${Date.now()}`,
        entityType, entityId, operation,
        JSON.stringify(payload),
        Date.now(),
      ]
    );
  },

  getPendingSync: async () => {
    const database = await getDb();
    return await database.getAllAsync(
      'SELECT * FROM pending_sync ORDER BY created_at ASC'
    );
  },

  clearSyncRecord: async (id) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM pending_sync WHERE id = ?', [id]);
  },
};
