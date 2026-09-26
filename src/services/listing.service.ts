import { prisma } from '../db/prisma';
import { TelegramService } from './telegram.service';
import {
  ListingStatus,
  ListingAvailability,
} from '@prisma/client';

export interface CreateListingInput {
  sellerTelegramId: number;
  sellerUsername?: string | null;
  sellerFirstName?: string | null;
  productName: string;
  category: string;
  location: string;
  priceAmount: number;
  currency: string;
  condition: string;
  note?: string | null;
  contact: string;
  photoFileIds: string[];
}

export class ListingService {
  constructor(
    private telegramService: TelegramService
  ) {}

  async createListing(data: CreateListingInput) {
    const listing = await prisma.listing.create({
      data: {
        sellerTelegramId: BigInt(
          data.sellerTelegramId
        ),
        sellerUsername:
          data.sellerUsername || null,
        sellerFirstName:
          data.sellerFirstName || null,
        productName: data.productName,
        category: data.category,
        location: data.location,
        priceAmount: data.priceAmount,
        currency: data.currency,
        condition: data.condition,
        note: data.note || null,
        contact: data.contact,
        photoFileIds: data.photoFileIds,
        status: ListingStatus.PENDING,
        availability:
          ListingAvailability.AVAILABLE,
      },
    });

    const formattedListing = {
      id: listing.id,
      sellerTelegramId: Number(
        listing.sellerTelegramId
      ),
      sellerUsername:
        listing.sellerUsername,
      sellerFirstName:
        listing.sellerFirstName,
      productName: listing.productName,
      category: listing.category,
      location: listing.location,
      priceAmount: listing.priceAmount,
      currency: listing.currency,
      condition: listing.condition,
      note: listing.note,
      contact: listing.contact,
      photoFileIds:
        listing.photoFileIds,
      availability:
        listing.availability,
    };

    await this.telegramService.sendToAdminGroup(
      formattedListing
    );

    return formattedListing;
  }

  async approveListing(id: string) {
    const listing =
      await prisma.listing.findUnique({
        where: { id },
      });

    if (!listing) {
      throw new Error('Listing not found');
    }

    const updated =
      await prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.APPROVED,
        },
      });

    return {
      message:
        `✅ <b>အတည်ပြုပြီးပါပြီ</b>\n\n` +
        `ပစ္စည်း: ${updated.productName}\n` +
        `ဈေးနှုန်း: ${updated.priceAmount} ${updated.currency}`,
    };
  }

  async rejectListing(
    id: string,
    reason: string
  ) {
    const listing =
      await prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.REJECTED,
          rejectionReason: reason,
        },
      });

    return {
      message:
        `❌ <b>ပယ်ဖျက်ပြီးပါပြီ</b>\n\n` +
        `ပစ္စည်း: ${listing.productName}\n` +
        `အကြောင်းပြချက်: ${reason}`,
    };
  }

  async markAsSoldOut(id: string) {
    const listing =
      await prisma.listing.update({
        where: { id },
        data: {
          availability:
            ListingAvailability.SOLD_OUT,
        },
      });

    return {
      message:
        `🔴 <b>Sold Out</b>\n\n` +
        `ပစ္စည်း: ${listing.productName}`,
    };
  }

  async markAsAvailable(id: string) {
    const listing =
      await prisma.listing.update({
        where: { id },
        data: {
          availability:
            ListingAvailability.AVAILABLE,
        },
      });

    return {
      message:
        `🟢 <b>Available</b>\n\n` +
        `ပစ္စည်း: ${listing.productName}`,
    };
  }
}