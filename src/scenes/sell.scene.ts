import { Scenes, Markup } from 'telegraf';
import { MyContext, WizardSessionData, Category, Location } from '../types/listing';
import { generateListingId } from '../utils/idGenerator';
import { z } from 'zod';

function wiz(ctx: MyContext): WizardSessionData {
  return ctx.wizard.state as WizardSessionData;
}

const CATEGORIES = [
  { label: '📱 ဖုန်း/လျှပ်စစ်', value: Category.ELECTRONICS },
  { label: '👕 အဝတ်အထည်/ဖိနပ်', value: Category.CLOTHING },
  { label: '🏠 အိမ်သုံးပစ္စည်း', value: Category.HOME },
  { label: '🛵 ယာဉ်/ဆိုင်ကယ်', value: Category.VEHICLE },
  { label: '📦 အခြား', value: Category.OTHER },
];

const LOCATIONS = [
  { label: '📍 ရွှေက္ကိုလ်', value: Location.SHWE_KOKKO },
  { label: '📍 မြဝတီ', value: Location.MYAWADDY },
];

export const sellScene = new Scenes.WizardScene<MyContext>(
  'SELL_SCENE',
  async (ctx) => {
    await ctx.reply('🛍 ရောင်းချလိုသည့် ပစ္စည်းအမည်ကို ရေးပေးပါ -\n\n(ဥပမာ - iPhone 13 Pro)', Markup.removeKeyboard());
    ctx.wizard.next();
  },
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
    if (!text || text.length > 100) return ctx.reply('⚠️ ပစ္စည်းအမည်ကို မှန်ကန်စွာ ရေးပေးပါ။ (အများဆုံး ၁၀၀ လုံး)');
    wiz(ctx).productName = text;
    const buttons = CATEGORIES.map(c => Markup.button.callback(c.label, `cat:${c.value}`));
    await ctx.reply('📂 ပစ္စည်း အမျိုးအစားကို ရွေးချယ်ပါ -', Markup.inlineKeyboard(buttons, { columns: 1 }));
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.callbackQuery.data.startsWith('cat:')) {
      return ctx.reply('⚠️ ခလုတ်ကို နှိပ်၍ ရွေးချယ်ပေးပါ။');
    }
    const category = ctx.callbackQuery.data.split(':')[1] as Category;
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(`📂 ရွေးချယ်ထားသော အမျိုးအစား - ${CATEGORIES.find(c => c.value === category)?.label}`);
    wiz(ctx).category = category;
    const buttons = LOCATIONS.map(l => Markup.button.callback(l.label, `loc:${l.value}`));
    await ctx.reply('📍 ပစ္စည်းရှိသည့် တည်နေရာကို ရွေးချယ်ပါ -', Markup.inlineKeyboard(buttons, { columns: 1 }));
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.callbackQuery.data.startsWith('loc:')) {
      return ctx.reply('⚠️ ခလုတ်ကို နှိပ်၍ ရွေးချယ်ပေးပါ။');
    }
    const location = ctx.callbackQuery.data.split(':')[1] as Location;
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(`📍 ရွေးချယ်ထားသော တည်နေရာ - ${LOCATIONS.find(l => l.value === location)?.label}`);
    wiz(ctx).location = location;
    await ctx.reply('💰 ရောင်းချလိုသည့် ဈေးနှုန်းနှင့် ငွေကြေးအမျိုးအစားကို ရေးပေးပါ -\n\n(ဥပမာ - 20000 MMK သို့မဟုတ် 500 THB)');
    ctx.wizard.next();
  },
async (ctx) => {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  
  if (!match) {
    return ctx.reply('⚠️ ဈေးနှုန်းနှင့် ငွေကြေးကို မှန်ကန်စွာ ရေးပေးပါ။ (ဥပမာ - 20000 MMK)');
  }

  const amount = parseFloat(match[1]);
  const currency = match[2].toUpperCase() as Currency;

  if (amount <= 0 || !['MMK', 'THB'].includes(currency)) {
    return ctx.reply('⚠️ ဈေးနှုန်းမှားယွင်းနေပါသည်။ (MMK, THB သို့မဟုတ်အသုံးပြုပါ)');
  }

  wiz(ctx).price = { priceAmount: amount, currency };
  await ctx.reply('✨ ပစ္စည်း၏ လက်ရှိအခြေအနေနှင့် အပြစ်အနာဆာများကို ရေးပြပေးပါ -\n\n(ဥပမာ - 90% သန့်၊ အစုတ်အပြဲမရှိ၊ ဘူးပါမည်)');
  ctx.wizard.next();
},
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
    if (!text || text.length > 500) return ctx.reply('⚠️ ပစ္စည်းအခြေအနေကို မှန်ကန်စွာ ရေးပေးပါ။');
    wiz(ctx).condition = text;
    await ctx.reply('📞 ဝယ်ယူလိုသူများ ဆက်သွယ်ရန် ဖုန်းနံပါတ် သို့မဟုတ် Telegram Username ကို ရေးပေးပါ -\n\n(ဥပမာ - 09123456789 သို့မဟုတ် @username)');
    ctx.wizard.next();
  },
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
    if (!text || text.length > 100) return ctx.reply('⚠️ ဆက်သွယ်ရန် လိပ်စာကို မှန်ကန်စွာ ရေးပေးပါ။');
    wiz(ctx).contact = text;
    wiz(ctx).photoFileIds = [];
    await ctx.reply('📸 ပစ္စည်း ဓာတ်ပုံ ပို့ပေးပါ။\n\nအနည်းဆုံး ၁ ပုံ၊ အများဆုံး ၆ ပုံ ပို့နိုင်ပါသည်။\n\nဓာတ်ပုံ ပို့ပြီးပါက အောက်ပါ \'ပြီးပြီ ✅\' ခလုတ်ကို နှိပ်ပါ။', Markup.keyboard([['ပြီးပြီ ✅']]).resize());
    ctx.wizard.next();
  },
  async (ctx) => {
    const state = wiz(ctx);
    if (!state.photoFileIds) state.photoFileIds = [];

    if (ctx.message && 'text' in ctx.message && ctx.message.text === 'ပြီးပြီ ✅') {
      if (state.photoFileIds.length < 1) return ctx.reply('⚠️ အနည်းဆုံး ဓာတ်ပုံ ၁ ပုံ ပို့ပေးရန် လိုအပ်ပါသည်။');
      await ctx.reply('⏳ သင့်ပစ္စည်းကို စိစစ်ရန် ပို့ပေးနေပါသည်...', Markup.removeKeyboard());

      try {
        const payload = {
          id: generateListingId(),
          seller_telegram_id: ctx.from!.id,
          seller_username: ctx.from!.username || null,
          seller_first_name: ctx.from!.first_name || null,
          product_name: state.productName!,
          category: state.category!,
          location: state.location!,
          price_amount: state.price!.priceAmount,
          currency: state.price!.currency,
          condition: state.condition!,
          contact: state.contact!,
          photo_file_ids: state.photoFileIds,
        };

        await ctx.listingService.createListing(payload);
        await ctx.reply('✅ သင့်ပစ္စည်းအား အုပ်ထိန်းသူများထံ ပို့ပေးလိုက်ပါပြီ။ အတည်ပြုချက်ရရှိပါက Channel တွင် ဖော်ပြပေးပါမည်။');
      } catch (error) {
        console.error('❌ Listing Creation Error:', error);
        if (error instanceof z.ZodError) {
          await ctx.reply('⚠️ အချက်အလက်များ မပြည့်စုံပါ။ ကျေးဇူးပြု၍ ပြန်လည်စတင်ပါ။');
        } else {
          await ctx.reply('⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်ထပ်ကြိုးစားပါ။');
        }
      }
      return ctx.scene.leave();
    }

    if (ctx.message && 'photo' in ctx.message) {
      if (state.photoFileIds.length >= 6) return ctx.reply('⚠️ ဓာတ်ပုံ အများဆုံး ၆ ပုံသာ ပို့နိုင်ပါသည်။');
      const photos = ctx.message.photo;
      state.photoFileIds.push(photos[photos.length - 1].file_id);
      return ctx.reply(`✅ ဓာတ်ပုံ လက်ခံရရှိပါပြီ။ (${state.photoFileIds.length}/6)`);
    }
  }
);