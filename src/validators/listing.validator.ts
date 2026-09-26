import { z } from 'zod';
import {
  Category,
  Location,
} from '../types/listing';

// ============================================================
// Create Listing Schema
// ============================================================

export const CreateListingSchema =
  z.object({
    sellerTelegramId:
      z.number().int().positive(),

    sellerUsername:
      z.string()
        .max(100)
        .nullable()
        .optional(),

    sellerFirstName:
      z.string()
        .max(100)
        .nullable()
        .optional(),

    productName:
      z.string()
        .trim()
        .min(1)
        .max(100),

    category:
      z.nativeEnum(Category),

    location:
      z.nativeEnum(Location),

    priceAmount:
      z.number()
        .finite()
        .positive(),

    currency:
      z.enum([
        'MMK',
        'THB',
        'USD',
      ]),

    condition:
      z.string()
        .trim()
        .min(1)
        .max(500),

    note:
      z.string()
        .trim()
        .max(500)
        .nullable()
        .optional(),

    contact:
      z.string()
        .trim()
        .min(1)
        .max(100),

    photoFileIds:
      z.array(z.string().min(1))
        .min(1)
        .max(6),
  });

// ============================================================
// Type
// ============================================================

export type CreateListingDTO =
  z.infer<typeof CreateListingSchema>;