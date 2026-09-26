import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../types/listing';
import { config } from '../config';

export interface AdminListingPayload {
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
  note?: string | null;
  contact: string;
  photoFileIds: string[];
  availability?: string;
}

function escapeHtml(
  value: string | number | null | undefined
): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class TelegramService {
  constructor(
    private bot: Telegraf<MyContext>
  ) {}

  async sendToAdminGroup(
    listing: AdminListingPayload
  ) {
    const noteSection = listing.note
      ? `\n📝 <b>မှတ်ချက်:</b> ${escapeHtml(
          listing.note
        )}\n`
      : '';

    const caption =
      `<b>📌 ရောင်းရန် ပစ္စည်းအသစ် ရောက်ရှိလာပါသည်</b>\n\n` +

      `📦 <b>ပစ္စည်းအမည်:</b> ` +
      `${escapeHtml(
        listing.productName
      )}\n` +

      `🏷️ <b>အမျိုးအစား:</b> ` +
      `${escapeHtml(
        listing.category
      )}\n` +

      `📍 <b>မြို့နယ်:</b> ` +
      `${escapeHtml(
        listing.location
      )}\n` +

      `💰 <b>ဈေးနှုန်း:</b> ` +
      `${escapeHtml(
        String(listing.priceAmount)
      )} ${escapeHtml(
        listing.currency
      )}\n` +

      `📦 <b>အခြေအနေ:</b> ` +
      `${escapeHtml(
        listing.condition
      )}\n` +

      noteSection +

      `📞 <b>ဆက်သွယ်ရန်:</b> ` +
      `${escapeHtml(
        listing.contact
      )}\n` +

      `👤 <b>ရောင်းသူ:</b> ` +
      `@${escapeHtml(
        listing.sellerUsername ||
          'မရှိပါ'
      )} ` +
      `(ID: <code>${escapeHtml(
        listing.sellerTelegramId
      )}</code>)`;

    const inlineKeyboard =
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

    if (
      listing.photoFileIds &&
      listing.photoFileIds.length > 0
    ) {
      console.log(
        '📤 Sending listing to admin group...'
      );

      console.log(
        '📍 Admin Chat ID:',
        config.adminChatId
      );

      console.log(
        '🖼️ Photo File ID:',
        listing.photoFileIds[0]
      );

      try {
        const result =
          await this.bot.telegram.sendPhoto(
            config.adminChatId,
            listing.photoFileIds[0],
            {
              caption,
              parse_mode: 'HTML',
              ...inlineKeyboard,
            }
          );

        console.log(
          '✅ Successfully sent listing to admin group'
        );

        return result;
      } catch (error) {
        console.error(
          '❌ Failed to send listing to admin group:',
          error
        );

        if (error instanceof Error) {
          console.error(
            '❌ Telegram error:',
            error.message
          );

          console.error(
            '❌ Stack:',
            error.stack
          );
        }

        throw error;
      }
    }

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