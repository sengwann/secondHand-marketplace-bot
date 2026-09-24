import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../types/listing';
import { isAdmin } from '../middleware/adminAuth';
import { config } from '../config';
import { ListingService } from '../services/listing.service';

export function registerAdminHandlers(bot: Telegraf<MyContext>, listingService: ListingService) {

  bot.action(/^approve:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။', { show_alert: true }).catch(() => {});
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
    const listingId = ctx.match[1];

    try {
      const result = await listingService.approveListing(listingId);

      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageCaption(result.message, { parse_mode: 'HTML' });
        } catch (err) {
          try {
            await ctx.editMessageText(result.message);
          } catch (e) {
            // Ignore editing errors
          }
        }
      }
    } catch (error) {
      console.error('Admin approve error', error);
    }
  });

  bot.action(/^reject:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။', { show_alert: true }).catch(() => {});
      return;
    }

    const listingId = ctx.match[1];
    const originalMsgId = ctx.callbackQuery!.message!.message_id;

    await ctx.answerCbQuery().catch(() => {});
    await ctx.reply(
      `❌ ပယ်ဖျက်မည် - ID: ${listingId} | MSG: ${originalMsgId}\n\nပယ်ဖျက်ရသည့် အကြောင်းပြချက်ကို ရေးပေးပါ -`,
      Markup.forceReply()
    );
  });

  bot.on('text', async (ctx, next) => {
    if (
      isAdmin(ctx) &&
      ctx.chat?.id.toString() === config.adminChatId.toString() &&
      ctx.message.reply_to_message
    ) {
      const replyToMsg = ctx.message.reply_to_message;
      // Safe type guard: only access .text if it exists on the message type
      const replyText = 'text' in replyToMsg ? replyToMsg.text : '';
      const match = replyText.match(/^❌ ပယ်ဖျက်မည် - ID: (.+) \| MSG: (\d+)/);

      if (match) {
        const listingId = match[1];
        const originalMsgId = parseInt(match[2], 10);
        const reason = ctx.message.text.trim();

        if (!reason) {
          await ctx.reply('⚠️ အကြောင်းပြချက် မရှိပါ။');
          return;
        }

        const result = await listingService.rejectListing(listingId, reason);

        try {
          await ctx.telegram.editMessageCaption(ctx.chat.id, originalMsgId, undefined, result.message, { parse_mode: 'HTML' });
        } catch (err) {
          try {
            await ctx.telegram.editMessageText(ctx.chat.id, originalMsgId, undefined, result.message);
          } catch (e) {
            // Ignore
          }
        }

        return;
      }
    }
    return next();
  });
}