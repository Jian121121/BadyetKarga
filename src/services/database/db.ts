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
    estimatedCost REAL NOT NULL,
    isChecked INTEGER NOT NULL DEFAULT 0
  );
`);


}