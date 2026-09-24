import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'http';

// Load environment variables first
dotenv.config();

import { config } from './config';
import { MyContext, WizardSessionData } from './types/listing';
import { sellScene } from './scenes/sell.scene';
import { TelegramService } from './services/telegram.service';
import { ListingService } from './services/listing.service';
import { closeDatabase, getDatabase } from './db/database';
import { registerAdminHandlers } from './handlers/admin.handler';

// --- 1. PROXY CONFIGURATION ---
let telegramOptions: ConstructorParameters<typeof Telegraf>[1] | undefined;

const socksProxy = process.env.SOCKS_PROXY;
const httpProxy = process.env.HTTP_PROXY;

if (socksProxy) {
  console.log(`🔌 Using SOCKS proxy...`);
  telegramOptions = {
    telegram: {
      agent: new SocksProxyAgent(socksProxy),
    },
  };
} else if (httpProxy) {
  console.log(`🔌 Using HTTP/HTTPS proxy...`);
  telegramOptions = {
    telegram: {
      agent: new HttpsProxyAgent(httpProxy),
    },
  };
}

// --- 2. BOT INITIALIZATION ---
const bot = new Telegraf<MyContext>(config.botToken, telegramOptions);

// Initialize SQLite Database
getDatabase();

// Setup Services
const telegramService = new TelegramService(bot);
const listingService = new ListingService(telegramService);

// --- 3. DEBUG MIDDLEWARE ---
bot.use(async (ctx, next) => {
  try {
    const updateType = ctx.updateType;
    const userId = ctx.from?.id || 'Unknown';
    
    if (updateType === 'message' && ctx.message && 'text' in ctx.message) {
      console.log(`📥 RECEIVED MESSAGE: "${ctx.message.text}" from User ID: ${userId}`);
    } else if (updateType === 'callback_query') {
      console.log(`🔘 RECEIVED BUTTON CLICK: "${(ctx.callbackQuery as any).data}" from User ID: ${userId}`);
    } else {
      console.log(`🔄 RECEIVED UPDATE: ${updateType} from User ID: ${userId}`);
    }
  } catch (err) {
    // Ignore logging errors
  }
  
  return next();
});

// --- 4. STANDARD MIDDLEWARE ---
// Use standard Telegraf session initialization
bot.use(session());

// Inject services into context for strict typing in scenes
bot.use((ctx, next) => {
  ctx.listingService = listingService;
  return next();
});

// Register Wizard Scene
const stage = new Scenes.Stage<MyContext>([sellScene], { ttl: 3600 });
bot.use(stage.middleware());

// --- 5. COMMAND HANDLERS ---
const startHandler = async (ctx: MyContext) => {
  try {
    await ctx.reply(
      `မင်္ဂလာပါ။ ${config.channelName} bot မှ ကြိုဆိုပါတယ်။ 📦\n\nရွှေက္ကိုလ် နှင့် မြဝတီ မြို့နယ်များအတွင်း သင့်၏ Second-hand ပစ္စည်းများကို တိုက်ရိုက် ရောင်းချရန်အတွက် အောက်ပါ ခလုတ်ကို နှိပ်ပါ သို့မဟုတ် /ရောင်းရန် ဟု စာပို့၍ စတင်နိုင်ပါသည်။`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🛍 ပစ္စည်းရောင်းမည်', 'start_sell')],
        [Markup.button.callback('📜 စည်းကမ်းချက်များ', 'rules')]
      ])
    );
  } catch (error) {
    console.error('Error in startHandler:', error);
  }
};

bot.command('start', startHandler);

bot.command('ရောင်းရန်', (ctx) => {
  ctx.scene.enter('SELL_SCENE');
});

bot.command('ပယ်ဖျက်ရန်', async (ctx) => {
  if (ctx.scene.current) {
    await ctx.scene.leave();
    await ctx.reply('❌ ပစ္စည်းတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါပြီ။', Markup.removeKeyboard());
  } else {
    await ctx.reply('လက်ရှိတွင် ဖျက်သိမ်းရန် လုပ်ဆောင်ချက် မရှိပါ။');
  }
});

// --- 6. CALLBACK HANDLERS ---
bot.action('start_sell', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  ctx.scene.enter('SELL_SCENE');
});

bot.action('rules', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await ctx.editMessageText(
      '📜 စည်းကမ်းချက်များ\n\n' +
      '၁။ မိမိပိုင်ဆိုင်သော ပစ္စည်းများကိုသာ ရောင်းချရပါမည်။\n' +
      '၂။ ဥပဒေနှင့် ငြိစွန်းသော ပစ္စည်းများ လုံးဝ တင်ခြင်းမရှိရ။\n' +
      '၃။ ဝယ်သူနှင့် ရောင်းသူ အချင်းချင်း ငွေကြေးလိမ်လည်မှုများအတွက် Admin များမှ တာဝန်ယူမည် မဟုတ်ပါ။\n' +
      '၄။ လူချင်းတွေ့ဆုံ၍ ပစ္စည်းသေချာ စစ်ဆေးပြီးမှသာ ငွေချေပါရန် အကြံပြုအပ်ပါသည်။',
      Markup.inlineKeyboard([Markup.button.callback('◀️ နောက်သို့', 'back_to_start')])
    );
  } catch (error) {
    console.error('Error editing rules message:', error);
  }
});

bot.action('back_to_start', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await ctx.deleteMessage().catch(() => {});
  } catch (e) {}
  startHandler(ctx);
});

// Register Admin Handlers
registerAdminHandlers(bot, listingService);

// --- 7. GLOBAL ERROR HANDLER ---
bot.catch((err, ctx) => {
  console.error(`\n❌ CRITICAL ERROR for ${ctx.updateType}:`);
  console.error(err);
  ctx.reply('⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်ထပ်ကြိုးစားပါ။').catch(console.error);
});

// --- 8. EXPRESS SERVER SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.status(200).send('✅ Shwe Kokko & Myawaddy Marketplace Bot is alive!');
});

let server: Server;

// --- 9. GRACEFUL SHUTDOWN ---
const stopBot = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Stopping process gracefully...`);
  bot.stop(signal);
  closeDatabase();
  if (server) {
    server.close();
  }
  process.exit(0);
};

process.once('SIGINT', () => stopBot('SIGINT'));
process.once('SIGTERM', () => stopBot('SIGTERM'));

// --- 10. LAUNCH APP & BOT ---
async function main() {
  // Start Express server first
  server = app.listen(PORT, () => {
    console.log(`🌐 Health-check server running on port ${PORT}`);
  });

  // Start Telegram Bot
  try {
    console.log('🚀 Connecting to Telegram API...');
    
    // Clear old webhooks
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('✅ Webhooks cleared.');

    await bot.launch();
    console.log('✅ Bot started successfully! Waiting for messages...\n');
  } catch (err: any) {
    console.error('\n❌ FAILED TO START BOT:');
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.error('Network Error: Your internet or VPN is blocking api.telegram.org.');
    } else if (err.response?.error_code === 409) {
      console.error('Conflict Error: Another instance of this bot is already running.');
    } else if (err.response?.error_code === 401) {
      console.error('Auth Error: BOT_TOKEN is invalid or revoked.');
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
}

main();
