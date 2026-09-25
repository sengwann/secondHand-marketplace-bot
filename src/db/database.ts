import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const databasePath = config.databasePath.trim();
  if (!databasePath) {
    throw new Error('DATABASE_PATH is empty');
  }

  const dir = path.dirname(databasePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
    db = new Database(databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    console.log(`SQLite database ready: ${databasePath}`);
    return db;
  } catch (error) {
    console.error('SQLite initialization failed', {
      databasePath,
      error: formatError(error),
    });
    if (db) {
      try { db.close(); } catch (closeError) {
        console.error('SQLite cleanup after initialization failure failed', closeError);
      }
      db = null;
    }
    throw error;
  }
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      seller_telegram_id INTEGER NOT NULL,
      seller_username TEXT,
      seller_first_name TEXT,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      price_amount REAL NOT NULL,
      currency TEXT NOT NULL,
      condition TEXT NOT NULL,
      contact TEXT NOT NULL,
      photo_file_ids TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVING', 'APPROVED', 'REJECTED')),
      rejection_reason TEXT,
      channel_message_id INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_telegram_id);
    CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
  `);
}

export function closeDatabase(): void {
  if (!db) return;
  try {
    db.close();
  } catch (error) {
    console.error('SQLite close failed', formatError(error));
  } finally {
    db = null;
  }
}

function formatError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: 'UnknownError', message: String(error) };
}
