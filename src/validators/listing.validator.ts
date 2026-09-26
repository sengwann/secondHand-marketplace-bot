import { z } from 'zod';
import { Category, Location } from '../types/listing';

export const CreateListingSchema = z.object({
  id: z.string().min(1),
  seller_telegram_id: z.number().positive(),
  seller_username: z.string().nullable(),
  seller_first_name: z.string().nullable(),
  product_name: z.string().min(1).max(100),
  category: z.nativeEnum(Category),
  location: z.nativeEnum(Location),
  price_amount: z.number().positive(),
  currency: z.enum(['MMK', 'THB', 'USD']),
  condition: z.string().min(1).max(500),
  contact: z.string().min(1).max(100),
  photo_file_ids: z.array(z.string()).min(1).max(6),
});

export type CreateListingDTO = z.infer<typeof CreateListingSchema>;