import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../types/listing';
import { config } from '../config';

export class TelegramService {
  constructor(private bot: Telegraf<MyContext>) {}

  async sendToAdminGroup(listing: {
    id: string;
    sellerTelegramId: number;
    sellerUsername?: string | null;
    sellerFirstName?: string | null;
    productName: string;
    category: string;
    location: string;
    priceAmount: number;
    currency: string;
    condition: string;
    contact: string;
    photoFileIds: string[];
  }) {
    const caption = 
      `<b>📌 ရောင်းရန် ပစ္စည်းအသစ် ရောက်ရှိလာပါသည်</b>\n\n` +
      `<b>ပစ္စည်းအမည်:</b> ${listing.productName}\n` +
      `<b>အမျိုးအစား:</b> ${listing.category}\n` +
      `<b>မြို့နယ်:</b> ${listing.location}\n` +
      `<b>ဈေးနှုန်း:</b> ${listing.priceAmount} ${listing.currency}\n` +
      `<b>အခြေအနေ:</b> ${listing.condition}\n` +
      `<b>ဆက်သွယ်ရန်:</b> ${listing.contact}\n` +
      `<b>ရောင်းသူ:</b> @${listing.sellerUsername || 'မရှိပါ'} (ID: <code>${listing.sellerTelegramId}</code>)`;

    const inlineKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ အတည်ပြုမည်', `approve:${listing.id}`),
        Markup.button.callback('❌ ငြင်းပယ်မည်', `reject:${listing.id}`),
      ],
    ]);

    // Send photo with caption if photos are available
    if (listing.photoFileIds && listing.photoFileIds.length > 0) {
      return await this.bot.telegram.sendPhoto(
        config.adminChatId,
        listing.photoFileIds[0],
        {
          caption,
          parse_mode: 'HTML',
          ...inlineKeyboard,
        }
      );
    }

    // Send text message if no photos are provided
    return await this.bot.telegram.sendMessage(
      config.adminChatId,
      caption,
      {
        parse_mode: 'HTML',
        ...inlineKeyboard,
      }
    );
  }
}