import * as SQLite from 'expo-sqlite';

// Opens (or creates, if it doesn't exist yet) the local database file.
// This connection is reused everywhere else in the app — we don't want
// multiple separate connections to the same file.
export const db = SQLite.openDatabaseSync('badyetkarga.db');

/**
 * Creates all tables the app needs, if they don't already exist.
 * Safe to call every time the app starts — CREATE TABLE IF NOT EXISTS
 * does nothing if the table is already there.
 */
export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}