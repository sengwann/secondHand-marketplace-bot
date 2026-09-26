import { ListingRepository } from '../db/listing.repository';
import { TelegramService } from './telegram.service';
import { Listing } from '../types/listing';
import { CreateListingSchema, CreateListingDTO } from '../validators/listing.validator';

export class ListingService {
  constructor(private telegramService: TelegramService) {}

  async createListing(data: CreateListingDTO): Promise<Listing> {
    // 1. Zod Data Validation
    const validData = CreateListingSchema.parse(data);

    console.log('📝 [ListingService] Creating listing:', { id: validData.id });

    try {
      // 2. Prisma Insert & Retrieve in one operation
      console.log('💾 [ListingStep 1] Inserting into PostgreSQL...');
      const listing = await ListingRepository.create(validData);

      // 3. Send Admin Preview via Telegram
      console.log('📤 [ListingStep 2] Sending admin preview...');
      await this.telegramService.sendAdminPreview(listing);

      console.log('✅ [ListingService] Listing created successfully!', { id: listing.id });
      return listing;

    } catch (error: any) {
      console.error('❌ [ListingService Error] Listing creation failed!', error);
      throw error;
    }
  }

  async approveListing(id: string): Promise<{ success: boolean; message: string }> {
    const claimed = await ListingRepository.claimForApproval(id);
    if (!claimed) return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };

    try {
      const listing = await ListingRepository.findById(id);
      if (!listing) throw new Error('Listing not found after claim');
      
      const messageId = await this.telegramService.publishListing(listing);
      const approved = await ListingRepository.approve(id, messageId);
      
      if (!approved) {
        await ListingRepository.rollbackToPending(id);
        return { success: false, message: 'System error during approval.' };
      }
      
      await this.telegramService.notifySellerApproved(listing.seller_telegram_id);
      return { success: true, message: 'အခြေအနေ: အတည်ပြုပြီးပါပြီ ✅' };

    } catch (error: any) {
      await ListingRepository.rollbackToPending(id);
      console.error('❌ [Approval Failed] Rolled back to PENDING:', error);
      return { success: false, message: 'Channel တင်ရာတွင် အခက်အခဲရှိနေပါသည်။ နောက်ထပ်ကြိုးစားပါ။' };
    }
  }

  async rejectListing(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    const safeReason = reason.trim();
    if (!safeReason) return { success: false, message: 'ပယ်ဖျက်ရသည့် အကြောင်းပြချက် မရှိပါ။' };
    
    const rejected = await ListingRepository.reject(id, safeReason);
    if (!rejected) return { success: false, message: 'ဒီ ပို့စ်အား စိစစ်ပြီးသွားပါပြီ။' };
    
    const listing = await ListingRepository.findById(id);
    if (listing) {
      await this.telegramService.notifySellerRejected(listing.seller_telegram_id, safeReason);
    }
    
    return { success: true, message: 'အခြေအနေ: ပယ်ဖျက်ပြီးပါပြီ ❌' };
  }
}
