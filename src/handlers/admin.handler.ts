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
      await ctx
        .answerCbQuery(
          '⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။',
          {
            show_alert: true,
          }
        )
        .catch(() => {});

      return;
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

      /*
       * The Approve/Reject buttons are on
       * the separate control message.
       */
      const controlMessage =
        ctx.callbackQuery.message;

      if (!controlMessage) {
        return;
      }

      /*
       * TypeScript knows ctx.chat can be undefined,
       * so check it before using ctx.chat.id.
       */
      const chatId =
        ctx.chat?.id;

      if (chatId === undefined) {
        return;
      }

      try {
        /*
         * The control message is a text message,
         * so edit its text after approval.
         */
        await ctx.telegram.editMessageText(
          chatId,
          controlMessage.message_id,
          undefined,
          result.message,
          {
            parse_mode: 'HTML',
          }
        );
      } catch (error) {
        console.error(
          '❌ Failed to update approve control message:',
          error
        );
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
        await ctx
          .answerCbQuery(
            '⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။',
            {
              show_alert: true,
            }
          )
          .catch(() => {});

        return;
      }

      await ctx
        .answerCbQuery()
        .catch(() => {});

      const listingId =
        ctx.match[1];

      const controlMessage =
        ctx.callbackQuery.message;

      if (!controlMessage) {
        return;
      }

      /*
       * The control message was sent as a reply to
       * the first photo of the listing album.
       *
       * We reply to the control message asking for
       * the rejection reason.
       */
      await ctx.reply(
        `❌ ပယ်ဖျက်မည် - ID: ${listingId}\n\n` +
        `ပယ်ဖျက်ရသည့် အကြောင်းပြချက်ကို ရေးပေးပါ -`,
        {
          ...Markup.forceReply(),
          reply_parameters: {
            message_id:
              controlMessage.message_id,
          },
        }
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

    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      return next();
    }

    const repliedMessage =
      ctx.message.reply_to_message;

    if (!repliedMessage) {
      return next();
    }

    /*
     * The admin's message must be a reply to:
     *
     * ❌ ပယ်ဖျက်မည် - ID: xxx
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
      /*
       * Reject the listing in the database.
       */
      const result =
        await listingService.rejectListing(
          listingId,
          reason
        );

      /*
       * The rejection prompt is a reply to
       * the admin control message.
       *
       * Therefore:
       *
       * Admin reason
       *      ↓
       * Rejection prompt
       *      ↓
       * Control message
       */
      const rejectionPrompt =
        repliedMessage;

      const rejectionPromptData =
        rejectionPrompt as unknown as {
          reply_to_message?: {
            message_id: number;
          };
        };

      const controlMessageId =
        rejectionPromptData
          .reply_to_message
          ?.message_id;

      if (
        controlMessageId === undefined
      ) {
        console.error(
          '❌ Could not find control message ID for rejection.'
        );

        return;
      }

      /*
       * Update the admin control message.
       */
      try {
        await ctx.telegram.editMessageText(
          chatId,
          controlMessageId,
          undefined,
          result.message,
          {
            parse_mode: 'HTML',
          }
        );
      } catch (error) {
        console.error(
          '❌ Failed to update rejection control message:',
          error
        );
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