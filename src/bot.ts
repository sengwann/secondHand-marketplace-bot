import { Telegraf, Scenes, session, Markup } from 'telegraf';
import express, { Request, Response } from 'express';
import type { Agent } from 'http';
import dotenv from 'dotenv';
import { config } from './config';
import { MyContext, WizardSessionData } from './types/listing';
import { sellScene } from './scenes/sell.scene';
import { TelegramService } from './services/telegram.service';
import { ListingService } from './services/listing.service';
import { SettingService } from './services/setting.service';
import { prisma, closeDatabase } from './db/prisma';
import { registerAdminHandlers } from './handlers/admin.handler';

dotenv.config();

function createProxyAgent(): Agent | undefined {
  if (process.env.SOCKS_PROXY) return new (require('socks-proxy-agent').SocksProxyAgent)(process.env.SOCKS_PROXY);
  if (process.env.HTTP_PROXY) return new (require('https-proxy-agent').HttpsProxyAgent)(process.env.HTTP_PROXY);
  return undefined;
}

const proxyAgent = createProxyAgent();
const bot = new Telegraf<MyContext>(config.botToken, proxyAgent ? { telegram: { agent: proxyAgent } } : undefined);

// Services Initialization
const telegramService = new TelegramService(bot);
const listingService = new ListingService(telegramService);
const settingService = new SettingService();

// Middlewares
bot.use(session({ defaultSession: () => ({ wizard: {} } as Scenes.WizardSession<WizardSessionData>) }));
bot.use((ctx, next) => {
  ctx.listingService = listingService;
  ctx.settingService = settingService;
  return next();
});

const stage = new Scenes.Stage<MyContext>([sellScene], { ttl: 3600 });
bot.use(stage.middleware());

// Commands
const startHandler = async (ctx: MyContext) => {
  await ctx.reply(
    `မင်္ဂလာပါ။ ${config.channelName} bot မှ ကြိုဆိုပါတယ်။ 📦\n\nရွှေက္ကိုလ် နှင့် မြဝတီ မြို့နယ်အတွက် အထွေထွေ ရောင်းဝယ်မှု Bot တစ်ခု ဖြစ်ပါသည်။`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🛍 ပစ္စည်းရောင်းမည်', 'start_sell')],
      [Markup.button.callback('📜 စည်းကမ်းချက်များ', 'rules')]
    ])
  );
};

bot.command('start', startHandler);
bot.command('ရောင်းရန်', (ctx) => ctx.scene.enter('SELL_SCENE'));
bot.command('ပယ်ဖျက်ရန်', async (ctx) => {
  if (ctx.scene.current) {
    await ctx.scene.leave();
    await ctx.reply('❌ ပစ္စည်းတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါပြီ။', Markup.removeKeyboard());
  } else {
    await ctx.reply('လက်ရှိတွင် ဖျက်သိမ်းရန် လုပ်ဆောင်ချက် မရှိပါ။');
  }
});

// Callback Actions
bot.action('start_sell', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  ctx.scene.enter('SELL_SCENE');
});

// Dynamic Rule Fetching Action
bot.action('rules', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const rulesText = await ctx.settingService.getRules();
  
  await ctx.editMessageText(
    rulesText,
    Markup.inlineKeyboard([Markup.button.callback('◀️ နောက်သို့', 'back_to_start')])
  ).catch(() => {});
});

bot.action('back_to_start', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  await ctx.deleteMessage().catch(() => {});
  startHandler(ctx);
});

// Register Admin Commands and Actions
registerAdminHandlers(bot, listingService, settingService);

// Error & Shutdown Handling
bot.catch((err, ctx) => {
  console.error(`\n❌ CRITICAL ERROR for ${ctx.updateType}:`, err);
  ctx.reply('⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်မံကြိုးစားပါ။').catch(() => {});
});

const stopBot = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Stopping bot gracefully...`);
  bot.stop(signal);
  await closeDatabase();
  process.exit(0);
};

process.once('SIGINT', () => stopBot('SIGINT'));
process.once('SIGTERM', () => stopBot('SIGTERM'));

// Server Execution
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/telegram/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_TOKEN;
const WEBHOOK_URL = `${(process.env.WEBHOOK_DOMAIN || `http://localhost:${PORT}`).replace(/\/$/, '')}${WEBHOOK_PATH}`;

// Health check endpoint with explicit Express types
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('✅ Bot is alive!');
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Telegraf built-in webhook callback handler
app.use(bot.webhookCallback(WEBHOOK_PATH, { secretToken: WEBHOOK_SECRET }));

// 3. Start Express Server & Connect Services
app.listen(PORT, async () => {
  console.log(`🌐 Health-check server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connected successfully via Prisma 7+');

    await bot.telegram.setWebhook(WEBHOOK_URL, {
      drop_pending_updates: true,
      secret_token: WEBHOOK_SECRET,
    });
    console.log(`✅ Webhook configured: ${WEBHOOK_URL}`);
  } catch (err) {
    console.error('\n❌ FAILED TO START:', err);
    process.exit(1);
  }
});
