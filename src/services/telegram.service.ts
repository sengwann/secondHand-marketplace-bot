import {
  Markup,
  Telegraf,
} from 'telegraf';

import {
  Listing,
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

    // --------------------------------------------------------
    // No photos
    // --------------------------------------------------------

    if (
      listing.photoFileIds.length === 0
    ) {
      return this.bot.telegram.sendMessage(
        config.adminChatId,
        caption,
        {
          parse_mode: 'HTML',
          ...keyboard,
        }
      );
    }

    // --------------------------------------------------------
    // Multiple photos
    // --------------------------------------------------------
    //
    // Telegram media groups can contain up to 10 photos.
    //
    // We put the caption on the first photo.
    // The remaining photos are part of the same album.
    //
    // --------------------------------------------------------

    const media = listing.photoFileIds.map(
      (fileId, index) => ({
        type: 'photo' as const,
        media: fileId,
        ...(index === 0
          ? {
              caption,
              parse_mode: 'HTML' as const,
            }
          : {}),
      })
    );

    const messages =
      await this.bot.telegram.sendMediaGroup(
        config.adminChatId,
        media
      );

    // --------------------------------------------------------
    // Send admin buttons separately
    // --------------------------------------------------------
    //
    // Telegram does not allow the inline keyboard to be
    // attached to the media group as a whole.
    //
    // We send a separate message containing the buttons.
    //
    // --------------------------------------------------------

    const controlMessage =
      await this.bot.telegram.sendMessage(
        config.adminChatId,
        `📌 <b>ပစ္စည်းကို စီမံရန်</b>\n\n` +
        `ID: <code>${escapeHtml(listing.id)}</code>`,
        {
          parse_mode: 'HTML',
          ...keyboard,
          reply_parameters: {
            message_id: messages[0].message_id,
          },
        }
      );

    return controlMessage;
  }

  // ==========================================================
  // Channel
  // ==========================================================

  async publishToChannel(
    listing: Listing
  ) {
    const caption =
      formatListingMessage(listing);

    // --------------------------------------------------------
    // No photos
    // --------------------------------------------------------

    if (
      listing.photoFileIds.length === 0
    ) {
      return this.bot.telegram.sendMessage(
        config.channelId,
        caption,
        {
          parse_mode: 'HTML',
        }
      );
    }

    // --------------------------------------------------------
    // Multiple photos
    // --------------------------------------------------------

    const media = listing.photoFileIds.map(
      (fileId, index) => ({
        type: 'photo' as const,
        media: fileId,
        ...(index === 0
          ? {
              caption,
              parse_mode: 'HTML' as const,
            }
          : {}),
      })
    );

    const messages =
      await this.bot.telegram.sendMediaGroup(
        config.channelId,
        media
      );

    // --------------------------------------------------------
    // IMPORTANT
    // --------------------------------------------------------
    //
    // We keep the first message's ID.
    //
    // Your database currently has:
    //
    //   channelMessageId
    //
    // This ID represents the first photo in the album.
    //
    // The listing caption is also on this first photo,
    // so updateChannelListing() can continue editing it.
    //
    // --------------------------------------------------------

    return messages[0];
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
      if (
        listing.photoFileIds.length > 0
      ) {
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