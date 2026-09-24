import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dir = path.dirname(config.databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    db = new Database(config.databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  const db = getDatabase();
  
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_listings_status
    ON listings(status);

    CREATE INDEX IF NOT EXISTS idx_listings_seller
    ON listings(seller_telegram_id);

    CREATE INDEX IF NOT EXISTS idx_listings_created_at
    ON listings(created_at);
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}