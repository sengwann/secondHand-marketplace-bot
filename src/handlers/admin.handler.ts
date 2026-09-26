import {
  Markup,
  Telegraf,
} from 'telegraf';

import {
  MyContext,
} from '../types/listing';

import {
  isAdmin,
  isAdminChat,
} from '../middleware/adminAuth';

import {
  ListingService,
} from '../services/listing.service';

import {
  SettingService,
} from '../services/setting.service';

// ============================================================
// Admin handlers
// ============================================================

export function registerAdminHandlers(
  bot: Telegraf<MyContext>,
  listingService: ListingService,
  settingService: SettingService
) {
  // ==========================================================
  // /setrules
  // ==========================================================

  bot.command(
    'setrules',
    async (ctx) => {
      if (!isAdmin(ctx)) {
        return ctx.reply(
          '⚠️ ဤ Command ကို အုပ်ထိန်းသူများသာ အသုံးပြုခွင့်ရှိပါသည်။'
        );
      }

      const commandText =
        ctx.message.text;

      const newRules =
        commandText
          .replace(/^\/setrules\s*/, '')
          .trim();

      if (!newRules) {
        const currentRules =
          await settingService.getRules();

        return ctx.reply(
          `⚠️ စည်းကမ်းချက်အသစ် ထည့်သွင်းပေးပါ။\n\n` +
          `အသုံးပြုပုံ:\n` +
          `/setrules စည်းကမ်းချက်အသစ် စာသားများ...\n\n` +
          `လက်ရှိ စည်းကမ်းချက်များ:\n\n` +
          currentRules
        );
      }

      try {
        await settingService.updateRules(
          newRules
        );

        await ctx.reply(
          '✅ စည်းကမ်းချက်များကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။'
        );
      } catch (error) {
        console.error(
          '❌ Failed to update rules:',
          error
        );

        await ctx.reply(
          '❌ စည်းကမ်းချက်များ ပြောင်းလဲရာတွင် အမှားအယွင်း ရှိနေပါသည်။'
        );
      }
    }
  );

  // ==========================================================
  // Approve
  // ==========================================================

  bot.action(
    /^approve:(.+)$/,
    async (ctx) => {
      if (!isAdmin(ctx)) {
        return ctx
          .answerCbQuery(
            '⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။',
            {
              show_alert: true,
            }
          )
          .catch(() => {});
      }

      await ctx
        .answerCbQuery(
          '⏳ အတည်ပြုနေပါသည်...'
        )
        .catch(() => {});

      const listingId =
        ctx.match[1];

      try {
        const result =
          await listingService.approveListing(
            listingId
          );

        if (
          ctx.callbackQuery.message
        ) {
          try {
            await ctx.editMessageCaption(
              result.message,
              {
                parse_mode: 'HTML',
              }
            );
          } catch {
            await ctx
              .editMessageText(
                result.message,
                {
                  parse_mode: 'HTML',
                }
              )
              .catch(() => {});
          }
        }
      } catch (error) {
        console.error(
          '❌ Admin approve error:',
          error
        );

        await ctx
          .answerCbQuery(
            error instanceof Error
              ? `❌ ${error.message}`
              : '❌ အတည်ပြု၍ မရပါ။',
            {
              show_alert: true,
            }
          )
          .catch(() => {});
      }
    }
  );

  // ==========================================================
  // Reject
  // ==========================================================

  bot.action(
    /^reject:(.+)$/,
    async (ctx) => {
      if (!isAdmin(ctx)) {
        return ctx
          .answerCbQuery(
            '⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။',
            {
              show_alert: true,
            }
          )
          .catch(() => {});
      }

      await ctx
        .answerCbQuery()
        .catch(() => {});

      const listingId =
        ctx.match[1];

      const message =
        ctx.callbackQuery.message;

      if (!message) {
        return;
      }

      await ctx.reply(
        `❌ ပယ်ဖျက်မည် - ID: ${listingId}\n\n` +
        `ပယ်ဖျက်ရသည့် အကြောင်းပြချက်ကို ရေးပေးပါ -`,
        Markup.forceReply()
      );
    }
  );

  // ==========================================================
  // Rejection reason
  // ==========================================================

  bot.on(
    'text',
    async (ctx, next) => {
      /*
       * Only process rejection replies in
       * the admin chat.
       */

      if (
        !isAdmin(ctx) ||
        !isAdminChat(ctx) ||
        !('reply_to_message' in ctx.message)
      ) {
        return next();
      }

      /*
       * At this point TypeScript knows that
       * reply_to_message exists on ctx.message.
       */
      const repliedMessage =
        ctx.message.reply_to_message;

      if (!repliedMessage) {
        return next();
      }

      /*
       * The admin's rejection prompt contains:
       *
       * ❌ ပယ်ဖျက်မည် - ID: xxx
       *
       * Check its text before doing anything else.
       */
      const replyText =
        'text' in repliedMessage
          ? repliedMessage.text
          : '';

      const match =
        replyText.match(
          /^❌ ပယ်ဖျက်မည် - ID: (.+)$/
        );

      if (!match) {
        return next();
      }

      const listingId =
        match[1].trim();

      const reason =
        ctx.message.text.trim();

      if (!reason) {
        return ctx.reply(
          '⚠️ အကြောင်းပြချက် မရှိပါ။'
        );
      }

      try {
        const result =
          await listingService.rejectListing(
            listingId,
            reason
          );

        /*
         * repliedMessage is the admin's
         * "❌ ပယ်ဖျက်မည်..." message.
         *
         * That message itself was a reply to the
         * original listing message.
         *
         * We only need the original message ID.
         */
        const repliedMessageWithOriginal = repliedMessage as {
  reply_to_message?: {
    message_id: number;
  };
};

const originalMessageId =
  repliedMessageWithOriginal.reply_to_message?.message_id;

        if (
          originalMessageId !== undefined
        ) {
          try {
            await ctx.telegram.editMessageCaption(
              ctx.chat.id,
              originalMessageId,
              undefined,
              result.message,
              {
                parse_mode: 'HTML',
              }
            );
          } catch {
            await ctx.telegram
              .editMessageText(
                ctx.chat.id,
                originalMessageId,
                undefined,
                result.message,
                {
                  parse_mode: 'HTML',
                }
              )
              .catch(() => {});
          }
        }
      } catch (error) {
        console.error(
          '❌ Admin reject error:',
          error
        );

        await ctx.reply(
          error instanceof Error
            ? `❌ ${error.message}`
            : '❌ ပစ္စည်းပယ်ဖျက်ရာတွင် အမှားဖြစ်နေပါသည်။'
        );
      }

      return;
    }
  );
}