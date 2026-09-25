import { ListingRepository, CreateListingData } from '../db/listing.repository';
import { TelegramService } from './telegram.service';
import { Listing } from '../types/listing';

export class ListingService {
  constructor(private telegramService: TelegramService) {}

  async createListing(data: CreateListingData): Promise<Listing> {
    validateListingData(data);

    console.log('Creating listing', {
      id: data.id,
      sellerTelegramId: data.seller_telegram_id,
      photoCount: data.photo_file_ids.length,
      productName: data.product_name,
    });

    try {
      console.log('Listing step 1/3: inserting into SQLite', { id: data.id });
      ListingRepository.create(data);

      console.log('Listing step 2/3: reading listing from SQLite', { id: data.id });
      const listing = ListingRepository.findById(data.id);
      if (!listing) throw new Error('Failed to retrieve created listing');

      console.log('Listing step 3/3: sending admin preview', {
        id: listing.id,
        adminChatId: process.env.ADMIN_CHAT_ID ? '[configured]' : '[missing]',
        photoCount: listing.photo_file_ids.length,
      });
      await this.telegramService.sendAdminPreview(listing);
      console.log('Listing created successfully', { id: listing.id });
      return listing;
    } catch (error) {
      console.error('Listing creation failed', {
        id: data.id,
        sellerTelegramId: data.seller_telegram_id,
        photoCount: data.photo_file_ids.length,
        error: formatError(error),
      });
      throw error;
    }
  }

  async approveListing(id: string): Promise<{ success: boolean; message: string }> {
    const claimed = ListingRepository.claimForApproval(id);
    if (!claimed) return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };

    try {
      const listing = ListingRepository.findById(id);
      if (!listing) throw new Error('Listing not found after claim');
      const messageId = await this.telegramService.publishListing(listing);
      if (!ListingRepository.approve(id, messageId)) {
        ListingRepository.rollbackToPending(id);
        return { success: false, message: 'System error during approval.' };
      }
      await this.telegramService.notifySellerApproved(listing.seller_telegram_id);
      return { success: true, message: 'အခြေအနေ: အတည်ပြုပ��ီးပါပြီ ✅' };
    } catch (error) {
      ListingRepository.rollbackToPending(id);
      console.error('Approval failed, rolled back to PENDING', { id, error: formatError(error) });
      return { success: false, message: 'Channel တင်ရာတွင် အခက်အခဲရှိနေပါသည်။ နောက်ထပ်ကြိုးစားပါ။' };
    }
  }

  async rejectListing(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    const safeReason = reason.trim();
    if (!safeReason) return { success: false, message: 'ပယ်ဖျက်ရသည့် အကြောင်းပြချက် မရှိပါ။' };
    const rejected = ListingRepository.reject(id, safeReason);
    if (!rejected) return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };
    const listing = ListingRepository.findById(id);
    if (listing) await this.telegramService.notifySellerRejected(listing.seller_telegram_id, safeReason);
    return { success: true, message: 'အခြေအနေ: ပယ်ဖျက်ပြီးပါပြီ ❌' };
  }
}

function validateListingData(data: CreateListingData): void {
  const requiredStrings: Array<[string, unknown]> = [
    ['id', data.id], ['product_name', data.product_name], ['category', data.category],
    ['location', data.location], ['currency', data.currency], ['condition', data.condition],
    ['contact', data.contact],
  ];
  for (const [name, value] of requiredStrings) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid listing field: ${name}`);
  }
  if (!Number.isSafeInteger(data.seller_telegram_id)) throw new Error('Invalid seller_telegram_id');
  if (!Number.isFinite(data.price_amount) || data.price_amount <= 0) throw new Error('Invalid price_amount');
  if (!Array.isArray(data.photo_file_ids) || data.photo_file_ids.length < 1 || data.photo_file_ids.length > 6) {
    throw new Error('photo_file_ids must contain between 1 and 6 photos');
  }
  if (data.photo_file_ids.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new Error('photo_file_ids contains an invalid Telegram file ID');
  }
}

function formatError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { name: 'UnknownError', message: String(error) };
}
