import { prisma } from './prisma';
import { Listing, Category, Location, ListingStatus } from '../types/listing';
import { CreateListingDTO } from '../validators/listing.validator';

// Helper to map Prisma entity (with BigInt) to App entity (with Number)
function mapToEntity(model: any): Listing {
  return {
    ...model,
    seller_telegram_id: Number(model.sellerTelegramId),
    channel_message_id: model.channelMessageId ? Number(model.channelMessageId) : null,
    category: model.category as Category,
    location: model.location as Location,
    status: model.status as ListingStatus,
    photo_file_ids: model.photoFileIds,
    price_amount: model.priceAmount,
    seller_username: model.sellerUsername,
    seller_first_name: model.sellerFirstName,
    product_name: model.productName,
    rejection_reason: model.rejectionReason,
    created_at: model.createdAt,
  };
}

export const ListingRepository = {
  create: async (data: CreateListingDTO): Promise<Listing> => {
    const created = await prisma.listing.create({
      data: {
        id: data.id,
        sellerTelegramId: data.seller_telegram_id,
        sellerUsername: data.seller_username,
        sellerFirstName: data.seller_first_name,
        productName: data.product_name,
        category: data.category,
        location: data.location,
        priceAmount: data.price_amount,
        currency: data.currency,
        condition: data.condition,
        contact: data.contact,
        photoFileIds: data.photo_file_ids,
        status: 'PENDING',
      },
    });
    return mapToEntity(created);
  },

  findById: async (id: string): Promise<Listing | null> => {
    const row = await prisma.listing.findUnique({ where: { id } });
    if (!row) return null;
    return mapToEntity(row);
  },

  claimForApproval: async (id: string): Promise<boolean> => {
    const result = await prisma.listing.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'APPROVING' },
    });
    return result.count === 1;
  },

  approve: async (id: string, channelMessageId: number): Promise<boolean> => {
    const result = await prisma.listing.updateMany({
      where: { id, status: 'APPROVING' },
      data: { status: 'APPROVED', channelMessageId },
    });
    return result.count === 1;
  },

  reject: async (id: string, reason: string): Promise<boolean> => {
    const result = await prisma.listing.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    return result.count === 1;
  },

  rollbackToPending: async (id: string): Promise<void> => {
    await prisma.listing.updateMany({
      where: { id, status: 'APPROVING' },
      data: { status: 'PENDING' },
    });
  },
}