import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../types/listing';
import { isAdmin } from '../middleware/adminAuth';
import { config } from '../config';
import { ListingService } from '../services/listing.service';
import { SettingService } from '../services/setting.service';

export function registerAdminHandlers(
  bot: Telegraf<MyContext>,
  listingService: ListingService,
  settingService: SettingService
) {
  bot.command('setrules', async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply('⚠️ ဤ Command ကို အုပ်ထိန်းသူများသာ အသုံးပြုခွင့်ရှိပါသည်။');
    }

    const commandText = ctx.message.text;
    const newRules = commandText.replace(/^\/setrules\s*/, '').trim();

    if (!newRules) {
      const currentRules = await settingService.getRules();
      return ctx.reply(
        `⚠️ စည်းကမ်းချက်အသစ် ထည့်သွင်းပေးပါ။\n\n` +
        `အသုံးပြုပုံ:\n\`/setrules စည်းကမ်းချက်အသစ် စာသားများ...\` \n\n` +
        `လက်ရှိ စည်းကမ်းချက်များ:\n\n${currentRules}`,
        { parse_mode: 'Markdown' }
      );
    }

    try {
      await settingService.updateRules(newRules);
      await ctx.reply('✅ စည်းကမ်းချက်များကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။');
    } catch (error) {
      console.error('Failed to set rules:', error);
      await ctx.reply('❌ စည်းကမ်းချက်များ ပြောင်းလဲရာတွင် အမှားအယွင်း ရှိနေပါသည်။');
    }
  });

  bot.action(/^approve:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။', { show_alert: true }).catch(() => {});
    await ctx.answerCbQuery().catch(() => {});

    const listingId = ctx.match[1];
    try {
      const result = await listingService.approveListing(listingId);
      if (ctx.callbackQuery?.message) {
        try { await ctx.editMessageCaption(result.message, { parse_mode: 'HTML' }); }
        catch { await ctx.editMessageText(result.message, { parse_mode: 'HTML' }).catch(() => {}); }
      }
    } catch (error) {
      console.error('Admin approve error:', error);
    }
  });

  bot.action(/^reject:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('⚠️ ဤခလုတ်ကို အုပ်ထိန်းသူများသာ နှိပ်ခွင့်ရှိပါသည်။', { show_alert: true }).catch(() => {});
    await ctx.answerCbQuery().catch(() => {});

    const listingId = ctx.match[1];
    const originalMsgId = ctx.callbackQuery!.message!.message_id;
    await ctx.reply(`❌ ပယ်ဖျက်မည် - ID: ${listingId} | MSG: ${originalMsgId}\n\nပယ်ဖျက်ရသည့် အကြောင်းပြချက်ကို ရေးပေးပါ -`, Markup.forceReply());
  });

  bot.on('text', async (ctx, next) => {
    if (isAdmin(ctx) && ctx.chat?.id.toString() === config.adminChatId.toString() && ctx.message.reply_to_message) {
      const replyText = 'text' in ctx.message.reply_to_message ? ctx.message.reply_to_message.text : '';
      const match = replyText.match(/^❌ ပယ်ဖျက်မည် - ID: (.+) \| MSG: (\d+)/);

      if (match) {
        const [, listingId, originalMsgIdStr] = match;
        const reason = ctx.message.text.trim();
        if (!reason) return ctx.reply('⚠️ အကြောင်းပြချက် မရှိပါ။');

        const result = await listingService.rejectListing(listingId, reason);
        try { await ctx.telegram.editMessageCaption(ctx.chat.id, parseInt(originalMsgIdStr, 10), undefined, result.message, { parse_mode: 'HTML' }); }
        catch { await ctx.telegram.editMessageText(ctx.chat.id, parseInt(originalMsgIdStr, 10), undefined, result.message, { parse_mode: 'HTML' }).catch(() => {}); }
        return;
      }
    }
    return next();
  });
}