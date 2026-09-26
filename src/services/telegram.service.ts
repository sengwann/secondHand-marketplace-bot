import {
  Markup,
  Telegraf,
} from 'telegraf';

import {
  Listing,
} from '../types/listing';

import {
  MyContext,
} from '../types/listing';

import { config } from '../config';

import {
  escapeHtml,
} from '../utils/htmlEscape';

import {
  formatListingMessage,
} from '../utils/formatListing';

// ============================================================
// Admin payload
// ============================================================

export interface AdminListingPayload
  extends Listing {}

// ============================================================
// Telegram Service
// ============================================================

export class TelegramService {
  constructor(
    private bot: Telegraf<MyContext>
  ) {}

  // ==========================================================
  // Admin group
  // ==========================================================

  async sendToAdminGroup(
    listing: AdminListingPayload
  ) {
    const caption =
      this.buildAdminCaption(listing);

    const keyboard =
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '✅ အတည်ပြုမည်',
            `approve:${listing.id}`
          ),

          Markup.button.callback(
            '❌ ငြင်းပယ်မည်',
            `reject:${listing.id}`
          ),
        ],
      ]);

    if (listing.photoFileIds.length > 0) {
      return this.bot.telegram.sendPhoto(
        config.adminChatId,
        listing.photoFileIds[0],
        {
          caption,
          parse_mode: 'HTML',
          ...keyboard,
        }
      );
    }

    return this.bot.telegram.sendMessage(
      config.adminChatId,
      caption,
      {
        parse_mode: 'HTML',
        ...keyboard,
      }
    );
  }

  // ==========================================================
  // Channel
  // ==========================================================

  async publishToChannel(
    listing: Listing
  ) {
    const caption =
      formatListingMessage(listing);

    if (listing.photoFileIds.length === 0) {
      return this.bot.telegram.sendMessage(
        config.channelId,
        caption,
        {
          parse_mode: 'HTML',
        }
      );
    }

    return this.bot.telegram.sendPhoto(
      config.channelId,
      listing.photoFileIds[0],
      {
        caption,
        parse_mode: 'HTML',
      }
    );
  }

  // ==========================================================
  // Edit existing channel post
  // ==========================================================

  async updateChannelListing(
    listing: Listing
  ): Promise<void> {
    if (
      listing.channelMessageId === null
    ) {
      return;
    }

    const caption =
      formatListingMessage(listing);

    try {
      if (listing.photoFileIds.length > 0) {
        await this.bot.telegram.editMessageCaption(
          config.channelId,
          listing.channelMessageId,
          undefined,
          caption,
          {
            parse_mode: 'HTML',
          }
        );

        return;
      }

      await this.bot.telegram.editMessageText(
        config.channelId,
        listing.channelMessageId,
        undefined,
        caption,
        {
          parse_mode: 'HTML',
        }
      );
    } catch (error) {
      console.error(
        '❌ Failed to update channel listing:',
        error
      );

      throw error;
    }
  }

  // ==========================================================
  // Admin caption
  // ==========================================================

  private buildAdminCaption(
    listing: Listing
  ): string {
    const noteSection =
      listing.note
        ? `\n📝 <b>မှတ်ချက်:</b> ` +
          `${escapeHtml(listing.note)}\n`
        : '';

    const seller =
      listing.sellerUsername
        ? `@${escapeHtml(
            listing.sellerUsername
          )}`
        : 'မရှိပါ';

    return (
      `<b>📌 ရောင်းရန် ပစ္စည်းအသစ် ရောက်ရှိလာပါသည်</b>\n\n` +

      `📦 <b>ပစ္စည်းအမည်:</b> ` +
      `${escapeHtml(listing.productName)}\n` +

      `🏷️ <b>အမျိုးအစား:</b> ` +
      `${escapeHtml(listing.category)}\n` +

      `📍 <b>မြို့နယ်:</b> ` +
      `${escapeHtml(listing.location)}\n` +

      `💰 <b>ဈေးနှုန်း:</b> ` +
      `${escapeHtml(listing.priceAmount)} ` +
      `${escapeHtml(listing.currency)}\n` +

      `📦 <b>အခြေအနေ:</b> ` +
      `${escapeHtml(listing.condition)}\n` +

      noteSection +

      `📞 <b>ဆက်သွယ်ရန်:</b> ` +
      `${escapeHtml(listing.contact)}\n` +

      `👤 <b>ရောင်းသူ:</b> ` +
      `${seller}\n` +

      `(ID: <code>${escapeHtml(
        listing.sellerTelegramId
      )}</code>)`
    );
  }
}