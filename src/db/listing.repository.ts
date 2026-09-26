import {
  Listing,
  Category,
  Location,
  ListingStatus,
  ListingAvailability,
  Currency,
} from '../types/listing';

import { prisma } from './prisma';

// ============================================================
// Repository input
// ============================================================

export interface CreateListingRepositoryInput {
  sellerTelegramId: number;
  sellerUsername: string | null;
  sellerFirstName: string | null;

  productName: string;
  category: Category;
  location: Location;

  priceAmount: number;
  currency: Currency;

  condition: string;
  note: string | null;
  contact: string;

  photoFileIds: string[];
}

// ============================================================
// Prisma -> Application entity
// ============================================================

function mapToEntity(
  model: {
    id: string;
    sellerTelegramId: bigint;
    sellerUsername: string | null;
    sellerFirstName: string | null;
    productName: string;
    category: string;
    location: string;
    priceAmount: number;
    currency: string;
    condition: string;
    note: string | null;
    contact: string;
    photoFileIds: string[];
    status: ListingStatus;
    availability: ListingAvailability;
    rejectionReason: string | null;
    channelMessageId: bigint | null;
    createdAt: Date;
  }
): Listing {
  return {
    id: model.id,

    sellerTelegramId:
      Number(model.sellerTelegramId),

    sellerUsername:
      model.sellerUsername,

    sellerFirstName:
      model.sellerFirstName,

    productName:
      model.productName,

    category:
      model.category as Category,

    location:
      model.location as Location,

    priceAmount:
      model.priceAmount,

    currency:
      model.currency as Currency,

    condition:
      model.condition,

    note:
      model.note,

    contact:
      model.contact,

    photoFileIds:
      model.photoFileIds,

    status:
      model.status,

    availability:
      model.availability,

    rejectionReason:
      model.rejectionReason,

    channelMessageId:
      model.channelMessageId === null
        ? null
        : Number(model.channelMessageId),

    createdAt:
      model.createdAt,
  };
}

// ============================================================
// Repository
// ============================================================

export const ListingRepository = {
  // ----------------------------------------------------------
  // Create
  // ----------------------------------------------------------

  async create(
    data: CreateListingRepositoryInput
  ): Promise<Listing> {
    const created =
      await prisma.listing.create({
        data: {
          sellerTelegramId:
            BigInt(data.sellerTelegramId),

          sellerUsername:
            data.sellerUsername,

          sellerFirstName:
            data.sellerFirstName,

          productName:
            data.productName,

          category:
            data.category,

          location:
            data.location,

          priceAmount:
            data.priceAmount,

          currency:
            data.currency,

          condition:
            data.condition,

          note:
            data.note,

          contact:
            data.contact,

          photoFileIds:
            data.photoFileIds,

          status:
            ListingStatus.PENDING,

          availability:
            ListingAvailability.AVAILABLE,
        },
      });

    return mapToEntity(created);
  },

  // ----------------------------------------------------------
  // Find by ID
  // ----------------------------------------------------------

  async findById(
    id: string
  ): Promise<Listing | null> {
    const listing =
      await prisma.listing.findUnique({
        where: { id },
      });

    if (!listing) {
      return null;
    }

    return mapToEntity(listing);
  },

  // ----------------------------------------------------------
  // Claim listing for approval
  // ----------------------------------------------------------

  async claimForApproval(
    id: string
  ): Promise<boolean> {
    const result =
      await prisma.listing.updateMany({
        where: {
          id,
          status: ListingStatus.PENDING,
        },

        data: {
          status:
            ListingStatus.APPROVING,
        },
      });

    return result.count === 1;
  },

  // ----------------------------------------------------------
  // Approve
  // ----------------------------------------------------------

  async approve(
    id: string,
    channelMessageId: number
  ): Promise<boolean> {
    const result =
      await prisma.listing.updateMany({
        where: {
          id,
          status:
            ListingStatus.APPROVING,
        },

        data: {
          status:
            ListingStatus.APPROVED,

          channelMessageId:
            BigInt(channelMessageId),
        },
      });

    return result.count === 1;
  },

  // ----------------------------------------------------------
  // Reject
  // ----------------------------------------------------------

  async reject(
    id: string,
    reason: string
  ): Promise<boolean> {
    const result =
      await prisma.listing.updateMany({
        where: {
          id,
          status:
            ListingStatus.PENDING,
        },

        data: {
          status:
            ListingStatus.REJECTED,

          rejectionReason:
            reason,
        },
      });

    return result.count === 1;
  },

  // ----------------------------------------------------------
  // Rollback approval
  // ----------------------------------------------------------

  async rollbackToPending(
    id: string
  ): Promise<boolean> {
    const result =
      await prisma.listing.updateMany({
        where: {
          id,
          status:
            ListingStatus.APPROVING,
        },

        data: {
          status:
            ListingStatus.PENDING,
        },
      });

    return result.count === 1;
  },

  // ----------------------------------------------------------
  // Change availability
  // ----------------------------------------------------------

  async updateAvailability(
    id: string,
    availability: ListingAvailability
  ): Promise<Listing> {
    const updated =
      await prisma.listing.update({
        where: { id },

        data: {
          availability,
        },
      });

    return mapToEntity(updated);
  },
};