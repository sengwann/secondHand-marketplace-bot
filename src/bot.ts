import { Telegraf, Scenes, session, Markup } from 'telegraf';
import type { Agent } from 'http';
import dotenv from 'dotenv';

dotenv.config();

import { config } from './config';
import { MyContext, WizardSessionData } from './types/listing';
import { sellScene } from './scenes/sell.scene';
import { TelegramService } from './services/telegram.service';
import { ListingService } from './services/listing.service';
import { closeDatabase, getDatabase } from './db/database';
import { registerAdminHandlers } from './handlers/admin.handler';

// --- 1. PROXY CONFIGURATION ---
// Using require() to avoid ESM/CJS module resolution conflicts
function createProxyAgent(): Agent | undefined {
  const socksProxy = process.env.SOCKS_PROXY;
  const httpProxy = process.env.HTTP_PROXY;

  if (socksProxy) {
    console.log('🔌 Using SOCKS proxy...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SocksProxyAgent } = require('socks-proxy-agent');
    return new SocksProxyAgent(socksProxy) as Agent;
  }

  if (httpProxy) {
    console.log('🔌 Using HTTP/HTTPS proxy...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { HttpsProxyAgent } = require('https-proxy-agent');
    return new HttpsProxyAgent(httpProxy) as Agent;
  }

  return undefined;
}

const proxyAgent = createProxyAgent();

// --- 2. BOT INITIALIZATION ---
const bot = proxyAgent
  ? new Telegraf<MyContext>(config.botToken, {
      telegram: { agent: proxyAgent },
    })
  : new Telegraf<MyContext>(config.botToken);

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
      console.log(`🔘 RECEIVED BUTTON CLICK from User ID: ${userId}`);
    } else {
      console.log(`🔄 RECEIVED UPDATE: ${updateType} from User ID: ${userId}`);
    }
  } catch (err) {
    // Ignore logging errors
  }
  return next();
});

// --- 4. STANDARD MIDDLEWARE ---
bot.use(session({
  defaultSession: () => ({ wizard: {} } as Scenes.WizardSession<WizardSessionData>)
}));

bot.use((ctx, next) => {
  ctx.listingService = listingService;
  return next();
});

const stage = new Scenes.Stage<MyContext>([sellScene], { ttl: 3600 });
bot.use(stage.middleware());

// --- 5. COMMAND HANDLERS ---

const startHandler = async (ctx: MyContext) => {
  try {
    await ctx.reply(
      `မင်္ဂလာပါ။ ${config.channelName} bot မှ ကြိုဆိုပါတယ်။ 📦\n\nရွှေက္ကိုလ် နှင့် မြဝတီ မြို့ကန်သာအတွက် အထွေထွေ ရောင်းဝယ်မှု Bot တစ်ခု ဖြစ်ပါသည်။`,
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
      '၃။ ဝယ်သူနှင့် ���ောင်းသူ အချင်းချင်း ငွေကြေးလိမ်လည်မှုများအတွက် Admin များကို သတင်းပေးပို့ရပါမည်။\n' +
      '၄။ လူချင်းတွေ့ဆုံ၍ ပစ္စည်းသေချာ စစ်ဆေးပြီးမှသာ ငွေချေပါရန် အကြံပြုအပ်ပါသည်။\n' +
      '၅။ Bot အသုံးပြုမှုနှင့် ပတ်သက်၍ စိတ်မပါသော အမည်များ၊ မမှန်ကန်သော အချက်အလက်များ တင်ခြင်းမပြုရ။',
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
  } catch (e) {
    // Ignore
  }
  startHandler(ctx);
});

// Register Admin Handlers
registerAdminHandlers(bot, listingService);

// --- 7. GLOBAL ERROR HANDLER ---
bot.catch((err, ctx) => {
  console.error(`\n❌ CRITICAL ERROR for ${ctx.updateType}:`);
  console.error(err);
  ctx.reply('⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်မံကြိုးစားပါ။');
});

// --- 8. GRACEFUL SHUTDOWN ---
const stopBot = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Stopping bot gracefully...`);
  bot.stop(signal);
  closeDatabase();
  process.exit(0);
};

process.once('SIGINT', () => stopBot('SIGINT'));
process.once('SIGTERM', () => stopBot('SIGTERM'));

// --- 9. WEBHOOK CONFIGURATION ---
import express from 'express';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/telegram/webhook';
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const webhookUrl = `${WEBHOOK_DOMAIN.replace(/\/$/, '')}${WEBHOOK_PATH}`;

app.get('/', (req, res) => {
  res.status(200).send('✅ Shwe Kokko & Myawaddy Marketplace Bot is alive!');
});

app.use(express.json());
app.use(bot.webhookCallback(WEBHOOK_PATH, { secretToken: WEBHOOK_SECRET_TOKEN }));

async function setupWebhook() {
  try {
    console.log('🚀 Setting Telegram webhook...');
    await bot.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true,
      secret_token: WEBHOOK_SECRET_TOKEN,
    });
    console.log(`✅ Webhook configured successfully: ${webhookUrl}`);
  } catch (err: unknown) {
    const error = err as { code?: string; response?: { error_code?: number }; message?: string };
    console.error('\n❌ FAILED TO SET WEBHOOK:');

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('Network Error: Your internet or VPN is blocking api.telegram.org.');
    } else if (error.response?.error_code === 401) {
      console.error('Auth Error: Your BOT_TOKEN in .env is invalid or revoked.');
    } else {
      console.error(error.message || err);
    }

    process.exit(1);
  }
}

// --- 10. START SERVER ---
app.listen(PORT, async () => {
  console.log(`🌐 Health-check server running on port ${PORT}`);
  await setupWebhook();
  console.log('✅ Bot is listening for webhook traffic...');
});
