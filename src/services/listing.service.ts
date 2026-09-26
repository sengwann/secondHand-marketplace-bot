import { prisma } from '../db/prisma';
import { TelegramService } from './telegram.service';

export class ListingService {
  constructor(private telegramService: TelegramService) {}

  async createListing(data: {
    sellerTelegramId: number;
    sellerUsername?: string;
    sellerFirstName?: string;
    productName: string;
    category: string;
    location: string;
    priceAmount: number;
    currency: string;
    condition: string;
    contact: string;
    photoFileIds: string[];
  }) {
    // 1. Save to Database (Cast sellerTelegramId to BigInt)
    const listing = await prisma.listing.create({
      data: {
        sellerTelegramId: BigInt(data.sellerTelegramId),
        sellerUsername: data.sellerUsername || null,
        sellerFirstName: data.sellerFirstName || null,
        productName: data.productName,
        category: data.category,
        location: data.location,
        priceAmount: data.priceAmount,
        currency: data.currency,
        condition: data.condition,
        contact: data.contact,
        photoFileIds: data.photoFileIds,
      },
    });

    // 2. Convert BigInt to Number/String before sending to Telegram logic
    const formattedListing = {
      ...listing,
      sellerTelegramId: Number(listing.sellerTelegramId),
      channelMessageId: listing.channelMessageId ? Number(listing.channelMessageId) : null,
    };

    // 3. Notify Admins
    await this.telegramService.sendToAdminGroup(formattedListing);

    return formattedListing;
  }
}