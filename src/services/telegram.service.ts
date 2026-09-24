import { Telegraf, Markup } from 'telegraf';
import { config } from '../config';
import { Listing } from '../types/listing';
import { formatListing } from '../utils/formatListing';
import { MyContext } from '../types/listing';

export class TelegramService {
  constructor(private bot: Telegraf<MyContext>) {}

  async sendAdminPreview(listing: Listing): Promise<number> {
    const caption = formatListing(listing);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('အတည်ပြုမည် ✅', `approve:${listing.id}`)],
      [Markup.button.callback('ပယ်ဖျက်မည် ❌', `reject:${listing.id}`)]
    ]);

    if (listing.photo_file_ids.length > 1) {
      const msg = await this.bot.telegram.sendPhoto(config.adminChatId, listing.photo_file_ids[0], {
        caption,
        parse_mode: 'HTML',
        ...keyboard
      });

      const media = listing.photo_file_ids.slice(1).map(fileId => ({
        type: 'photo' as const,
        media: fileId
      }));
      await this.bot.telegram.sendMediaGroup(config.adminChatId, media);
      return msg.message_id;
    } else if (listing.photo_file_ids.length === 1) {
      const msg = await this.bot.telegram.sendPhoto(config.adminChatId, listing.photo_file_ids[0], {
        caption,
        parse_mode: 'HTML',
        ...keyboard
      });
      return msg.message_id;
    } else {
      const msg = await this.bot.telegram.sendMessage(config.adminChatId, caption, {
        parse_mode: 'HTML',
        ...keyboard
      });
      return msg.message_id;
    }
  }

  async publishListing(listing: Listing): Promise<number> {
    const caption = formatListing(listing);
    let messageId: number = 0;

    if (listing.photo_file_ids.length > 1) {
      const media = listing.photo_file_ids.map((fileId, index) => ({
        type: 'photo' as const,
        media: fileId,
        caption: index === 0 ? caption : undefined,
        parse_mode: 'HTML' as const
      }));

      const messages = await this.bot.telegram.sendMediaGroup(config.channelId, media);
      messageId = messages[0].message_id;
    } else if (listing.photo_file_ids.length === 1) {
      const msg = await this.bot.telegram.sendPhoto(config.channelId, listing.photo_file_ids[0], {
        caption,
        parse_mode: 'HTML'
      });
      messageId = msg.message_id;
    } else {
      const msg = await this.bot.telegram.sendMessage(config.channelId, caption, {
        parse_mode: 'HTML'
      });
      messageId = msg.message_id;
    }

    return messageId;
  }

  async notifySellerApproved(sellerId: number): Promise<void> {
    const text = `✅ သင်၏ ပစ္စည်းတင်ပြချက်ကို အတည်ပြုပြီး Channel ပေါ်သို့ တင်ပေးလိုက်ပါပြီ။`;
    await this.bot.telegram.sendMessage(sellerId, text);
  }

  async notifySellerRejected(sellerId: number, reason: string): Promise<void> {
    const text = `❌ သင်၏ ပစ္စည်းတင်ပြချက်ကို ပယ်ဖျက်လိုက်ပါပြီ။\n\nအကြောင်းပြချက် -\n${reason}`;
    await this.bot.telegram.sendMessage(sellerId, text);
  }
}