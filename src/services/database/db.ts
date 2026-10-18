import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export const db = Platform.OS !== 'web' ? SQLite.openDatabaseSync('badyetkarga.db') : null;

export function initDatabase() {
  if (Platform.OS === 'web') {
    console.log('[DB] Running on web — skipping real SQLite init, using in-memory mock.');
    return;
  }

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      allergies TEXT,
      dietaryRestrictions TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  db!.execSync(`
  CREATE TABLE IF NOT EXISTS weekly_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    familyMemberId INTEGER NOT NULL,
    dayOfWeek TEXT NOT NULL,
    breakfast INTEGER NOT NULL DEFAULT 1,
    lunch INTEGER NOT NULL DEFAULT 1,
    snack INTEGER NOT NULL DEFAULT 1,
    dinner INTEGER NOT NULL DEFAULT 1
  );
`);


db!.execSync(`
  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    estimatedCost REAL NOT NULL,
    prepTimeMinutes INTEGER
  );
`);

db!.execSync(`
  CREATE TABLE IF NOT EXISTS meal_plan_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    dishId INTEGER NOT NULL,
    dayOfWeek TEXT NOT NULL,
    mealType TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

db!.execSync(`
  CREATE TABLE IF NOT EXISTS pantry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    ingredientName TEXT NOT NULL,
    quantity TEXT,
    createdAt TEXT NOT NULL
  );
`);


db!.execSync(`
  CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    ingredientName TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    estimatedCost REAL NOT NULL,
    priority TEXT NOT NULL DEFAULT 'high',
    usedInDishes TEXT NOT NULL DEFAULT '',
    isChecked INTEGER NOT NULL DEFAULT 0
  );
`);


db!.execSync(`
  CREATE TABLE IF NOT EXISTS dish_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dishId INTEGER NOT NULL,
    ingredientName TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    estimatedPrice REAL NOT NULL,
    priority TEXT NOT NULL DEFAULT 'high'
  );
`);


db!.execSync(`
  CREATE TABLE IF NOT EXISTS household_settings (
    userId INTEGER PRIMARY KEY,
    householdName TEXT NOT NULL,
    weeklyBudget REAL NOT NULL,
    householdGoal TEXT NOT NULL
  );
`);

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      userId INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (userId, key)
    );
  `);

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS shopping_trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      completedAt TEXT NOT NULL,
      weekStart TEXT NOT NULL,
      budgetSnapshot REAL NOT NULL,
      estimatedTotal REAL NOT NULL,
      actualTotal REAL NOT NULL
    );
  `);

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      ingredientName TEXT NOT NULL,
      normalizedName TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      estimatedCost REAL NOT NULL,
      actualCost REAL NOT NULL
    );
  `);

  // ── Safe column migrations ────────────────────────────────
  // ALTER TABLE fails if the column already exists, so each one
  // is wrapped in its own try/catch. New installs get the column
  // added right after CREATE IF NOT EXISTS; old installs get patched.
  const migrations: Array<[table: string, columnDef: string]> = [
    ['family_members', 'relationship TEXT'],
    ['family_members', 'age TEXT'],
    ['family_members', 'gender TEXT'],
    ['family_members', 'favoriteFoods TEXT'],
    ['household_settings', 'currency TEXT'],
    ['household_settings', 'cookFrequency TEXT'],
    ['household_settings', 'preferredCookTime TEXT'],
    ['household_settings', 'mealStyles TEXT'],
    // Dish library richness (descriptions, servings, wizard-style tags,
    // which meals a dish suits, and user-created dishes)
    ['dishes', 'description TEXT'],
    ['dishes', 'servings INTEGER DEFAULT 4'],
    ['dishes', 'tags TEXT'],
    ['dishes', "mealTypes TEXT DEFAULT 'lunch,dinner'"],
    ['dishes', 'isCustom INTEGER DEFAULT 0'],
    ['dishes', 'createdBy INTEGER'],
    // Week identity for safe Mon–Sun rollover
    ['meal_plan_entries', 'weekStartDate TEXT'],
    ['grocery_items', 'weekStartDate TEXT'],
    // Auth / profile extras
    ['users', 'avatarUri TEXT'],
    ['users', "authProvider TEXT DEFAULT 'email'"],
    ['users', 'googleId TEXT'],
    ['users', 'emailVerified INTEGER DEFAULT 1'],
    ['family_members', 'avatarUri TEXT'],
    ['dishes', 'imageUri TEXT'],
    // Household composition, buffers, religion & goals
    ['household_settings', 'totalMembers INTEGER DEFAULT 1'],
    ['household_settings', 'adults INTEGER DEFAULT 1'],
    ['household_settings', 'children INTEGER DEFAULT 0'],
    ['household_settings', 'seniors INTEGER DEFAULT 0'],
    ['household_settings', 'infantsToddlers INTEGER DEFAULT 0'],
    ['household_settings', 'visitorBufferServings INTEGER DEFAULT 0'],
    ['household_settings', 'budgetBufferPercentage REAL DEFAULT 0'],
    ['household_settings', "religion TEXT DEFAULT 'No Religious Restriction'"],
    ['household_settings', "selectedGoals TEXT DEFAULT '[]'"],
    ['household_settings', 'planDurationDays INTEGER DEFAULT 7'],
    ['household_settings', "customFoodRestrictions TEXT DEFAULT '[]'"],
  ];

  for (const [table, columnDef] of migrations) {
    try {
      db!.execSync(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    } catch {
      // Column already exists — nothing to do.
    }
  }

  // Repair: all rows in `users` are fully registered (OTP/Google). Pending lives elsewhere.
  try {
    db!.execSync(`UPDATE users SET emailVerified = 1 WHERE emailVerified IS NULL OR emailVerified = 0;`);
  } catch {
    // ignore
  }

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      codeHash TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  db!.execSync(`
    CREATE TABLE IF NOT EXISTS meal_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      dishId INTEGER NOT NULL,
      dishName TEXT NOT NULL,
      allowedForPlan INTEGER NOT NULL DEFAULT 1,
      reason TEXT,
      createdAt TEXT NOT NULL
    );
  `);
}