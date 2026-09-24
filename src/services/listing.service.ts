import { ListingRepository, CreateListingData } from '../db/listing.repository';
import { TelegramService } from './telegram.service';
import { Listing } from '../types/listing';

export class ListingService {
  constructor(private telegramService: TelegramService) {}

  async createListing(data: CreateListingData): Promise<Listing> {
    ListingRepository.create(data);
    const listing = ListingRepository.findById(data.id);
    if (!listing) throw new Error('Failed to retrieve created listing');
    
    await this.telegramService.sendAdminPreview(listing);
    return listing;
  }

  async approveListing(id: string): Promise<{ success: boolean; message: string }> {
    const claimed = ListingRepository.claimForApproval(id);
    if (!claimed) {
      return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };
    }

    try {
      const listing = ListingRepository.findById(id);
      if (!listing) throw new Error('Listing not found after claim');

      const messageId = await this.telegramService.publishListing(listing);
      
      const approved = ListingRepository.approve(id, messageId);
      if (!approved) {
         ListingRepository.rollbackToPending(id);
         return { success: false, message: 'System error during approval.' };
      }

      await this.telegramService.notifySellerApproved(listing.seller_telegram_id);
      return { success: true, message: 'အခြေအနေ: အတည်ပြုပြီးပါပြီ ✅' };
    } catch (error) {
      ListingRepository.rollbackToPending(id);
      console.error('Approval failed, rolled back to PENDING', error);
      return { success: false, message: 'Channel တင်ရာတွင် အခက်အခဲရှိနေပါသည်။ နောက်ထပ်ကြိုးစားပါ။' };
    }
  }

  async rejectListing(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    const rejected = ListingRepository.reject(id, reason);
    if (!rejected) {
      return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };
    }

    const listing = ListingRepository.findById(id);
    if (listing) {
      await this.telegramService.notifySellerRejected(listing.seller_telegram_id, reason);
    }

    return { success: true, message: 'အခြေအနေ: ပယ်ဖျက်ပြီးပါပြီ ❌' };
  }
}