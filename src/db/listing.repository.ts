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
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO listings (
          id, seller_telegram_id, seller_username, seller_first_name,
          product_name, category, location, price_amount, currency,
          condition, contact, photo_file_ids, status, created_at
        ) VALUES (
          @id, @seller_telegram_id, @seller_username, @seller_first_name,
          @product_name, @category, @location, @price_amount, @currency,
          @condition, @contact, @photo_file_ids, 'PENDING', @created_at
        )
      `).run({
        ...data,
        photo_file_ids: JSON.stringify(data.photo_file_ids),
        created_at: Date.now(),
      });
    } catch (error) {
      console.error('ListingRepository.create failed', { listingId: data.id, error });
      throw error;
    }
  },

  findById: (id: string): Listing | null => {
    const row = getDatabase().prepare('SELECT * FROM listings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    let photoFileIds: string[];
    try {
      photoFileIds = JSON.parse(String(row.photo_file_ids));
    } catch (error) {
      console.error('Invalid photo_file_ids JSON in SQLite', { listingId: id, error });
      throw new Error(`Invalid photo_file_ids for listing ${id}`);
    }
    if (!Array.isArray(photoFileIds)) throw new Error(`Invalid photo_file_ids for listing ${id}`);
    return { ...row, photo_file_ids: photoFileIds } as unknown as Listing;
  },

  claimForApproval: (id: string): boolean => getDatabase().prepare(`UPDATE listings SET status = 'APPROVING' WHERE id = ? AND status = 'PENDING'`).run(id).changes === 1,
  approve: (id: string, channelMessageId: number): boolean => getDatabase().prepare(`UPDATE listings SET status = 'APPROVED', channel_message_id = ? WHERE id = ? AND status = 'APPROVING'`).run(channelMessageId, id).changes === 1,
  reject: (id: string, reason: string): boolean => getDatabase().prepare(`UPDATE listings SET status = 'REJECTED', rejection_reason = ? WHERE id = ? AND status = 'PENDING'`).run(reason, id).changes === 1,
  rollbackToPending: (id: string): void => { getDatabase().prepare(`UPDATE listings SET status = 'PENDING' WHERE id = ? AND status = 'APPROVING'`).run(id); },
};
