import { getDatabase } from './database';
import { Listing } from '../types/listing';

export interface CreateListingData {
  id: string;
  seller_telegram_id: number;
  seller_username: string | null;
  seller_first_name: string | null;
  product_name: string;
  category: string;
  location: string;
  price_amount: number;
  currency: string;
  condition: string;
  contact: string;
  photo_file_ids: string[];
}

export const ListingRepository = {
  create: (data: CreateListingData): void => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO listings (
        id, seller_telegram_id, seller_username, seller_first_name,
        product_name, category, location, price_amount, currency,
        condition, contact, photo_file_ids, status, created_at
      ) VALUES (
        @id, @seller_telegram_id, @seller_username, @seller_first_name,
        @product_name, @category, @location, @price_amount, @currency,
        @condition, @contact, @photo_file_ids, 'PENDING', @created_at
      )
    `);
    
    stmt.run({
      ...data,
      photo_file_ids: JSON.stringify(data.photo_file_ids),
      created_at: Date.now()
    });
  },

  findById: (id: string): Listing | null => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM listings WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return mapRowToListing(row);
  },

  // ATOMIC CLAIM: Prevents race conditions during approval
  claimForApproval: (id: string): boolean => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE listings 
      SET status = 'APPROVING' 
      WHERE id = ? AND status = 'PENDING'
    `);
    const info = stmt.run(id);
    return info.changes === 1;
  },

  approve: (id: string, channelMessageId: number): boolean => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE listings 
      SET status = 'APPROVED', channel_message_id = ? 
      WHERE id = ? AND status = 'APPROVING'
    `);
    const info = stmt.run(channelMessageId, id);
    return info.changes === 1;
  },

  reject: (id: string, reason: string): boolean => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE listings 
      SET status = 'REJECTED', rejection_reason = ? 
      WHERE id = ? AND status = 'PENDING'
    `);
    const info = stmt.run(reason, id);
    return info.changes === 1;
  },

  rollbackToPending: (id: string): void => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE listings 
      SET status = 'PENDING' 
      WHERE id = ? AND status = 'APPROVING'
    `);
    stmt.run(id);
  }
};

function mapRowToListing(row: any): Listing {
  return {
    id: row.id,
    seller_telegram_id: row.seller_telegram_id,
    seller_username: row.seller_username,
    seller_first_name: row.seller_first_name,
    product_name: row.product_name,
    category: row.category,
    location: row.location,
    price_amount: row.price_amount,
    currency: row.currency,
    condition: row.condition,
    contact: row.contact,
    photo_file_ids: JSON.parse(row.photo_file_ids),
    status: row.status,
    rejection_reason: row.rejection_reason,
    channel_message_id: row.channel_message_id,
    created_at: row.created_at,
  };
}