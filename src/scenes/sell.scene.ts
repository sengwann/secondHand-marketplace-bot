import { Scenes, Markup } from 'telegraf';
import { MyContext, WizardSessionData, Category, Location } from '../types/listing';
import { generateListingId } from '../utils/idGenerator';

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
  
  // Step 0: Product Name
  async (ctx) => {
    await ctx.reply(
      '🛍 ရောင်းချလိုသည့် ပစ္စည်းအမည်ကို ရေးပေးပါ -\n\n(ဥပမာ - iPhone 13 Pro)',
      Markup.removeKeyboard()
    );
    ctx.wizard.next();
  },
  
  // Step 1: Validate Product Name -> Ask Category
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const productName = text.trim();

    if (!productName || productName.length < 1 || productName.length > 100) {
      await ctx.reply('⚠️ ပစ္စည်းအမည်ကို မှန်ကန်စွာ ရေးပေးပါ။ (အများဆုံး ၁၀၀ လုံး)');
      return;
    }

    ctx.wizard.state.productName = productName;

    const buttons = CATEGORIES.map(c => Markup.button.callback(c.label, `cat:${c.value}`));
    await ctx.reply('📂 ပစ္စည်း အမျိုးအစားကို ရွေးချယ်ပါ -', Markup.inlineKeyboard(buttons, { columns: 1 }));
    ctx.wizard.next();
  },

  // Step 2: Validate Category -> Ask Location
  // Inside Step 2 (Category selection)
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('⚠️ ခလုတ်ကို နှိပ်၍ ရွေးချယ်ပေးပါ။');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith('cat:')) {
      await ctx.answerCbQuery('မှန်ကန်သော ခလုတ်ကို နှိပ်ပါ။').catch(() => {});
      return;
    }

    const category = data.split(':')[1] as Category;
    if (!Object.values(Category).includes(category)) {
      await ctx.reply('⚠️ မှန်ကန်သော အမျိုးအစားကို ရွေးချယ်ပါ။');
      return;
    }

    // Answer FIRST
    await ctx.answerCbQuery().catch(() => {});
    // THEN edit
    await ctx.editMessageText(`📂 ရွေးချယ်ထားသော အမျိုးအစား - ${CATEGORIES.find(c => c.value === category)?.label}`);

    ctx.wizard.state.category = category;
    const buttons = LOCATIONS.map(l => Markup.button.callback(l.label, `loc:${l.value}`));
    await ctx.reply('📍 ပစ္စည်းရှိသည့် တည်နေရာကို ရွေးချယ်ပါ -', Markup.inlineKeyboard(buttons, { columns: 1 }));
    ctx.wizard.next();
  },

  // Inside Step 3 (Location selection)
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('⚠️ ခလုတ်ကို နှိပ်၍ ရွေးချယ်ပေးပါ။');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith('loc:')) {
      await ctx.answerCbQuery('မှန်ကန်သော ခလုတ်ကို နှိပ်ပါ။').catch(() => {});
      return;
    }

    const location = data.split(':')[1] as Location;
    if (!Object.values(Location).includes(location)) {
      await ctx.reply('⚠️ မှန်ကန်သော တည်နေရာကို ရွေးချယ်ပါ။');
      return;
    }

    // Answer FIRST
    await ctx.answerCbQuery().catch(() => {});
    // THEN edit
    await ctx.editMessageText(`📍 ရွေးချယ်ထားသော တည်နေရာ - ${LOCATIONS.find(l => l.value === location)?.label}`);

    ctx.wizard.state.location = location;
    await ctx.reply(
      '💰 ရောင်းချလိုသည့် ဈေးနှုန်းနှင့် ငွေကြေးအမျိုးအစားကို ရေးပေးပါ -\n\n(ဥပမာ - 20000 MMK သို့မဟုတ် 500 THB)'
    );
    ctx.wizard.next();
  },
  // Step 3: Validate Location -> Ask Price
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('⚠️ ခလုတ်ကို နှိပ်၍ ရွေးချယ်ပေးပါ။');
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith('loc:')) {
      await ctx.answerCbQuery('မှန်ကန်သော ခလုတ်ကို နှိပ်ပါ။');
      return;
    }

    const location = data.split(':')[1] as Location;
    if (!Object.values(Location).includes(location)) {
      await ctx.reply('⚠️ မှန်ကန်သော တည်နေရာကို ရွေးချယ်ပါ။');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(`📍 ရွေးချယ်ထားသော တည်နေရာ - ${LOCATIONS.find(l => l.value === location)?.label}`);

    ctx.wizard.state.location = location;

    await ctx.reply(
      '💰 ရောင်းချလိုသည့် ဈေးနှုန်းနှင့် ငွေကြေးအမျိုးအစားကို ရေးပေးပါ -\n\n(ဥပမာ - 20000 MMK သို့မဟုတ် 500 THB)'
    );
    ctx.wizard.next();
  },

  // Step 4: Validate Price -> Ask Condition
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const input = text.trim();

    const match = input.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (!match) {
      await ctx.reply('⚠️ ဈေးနှုန်းနှင့် ငွေကြေးကို မှန်ကန်စွာ ရေးပေးပါ။ (ဥပမာ - 20000 MMK)');
      return;
    }

    const amount = parseFloat(match[1]);
    const currency = match[2].toUpperCase();

    if (amount <= 0) {
      await ctx.reply('⚠️ ဈေးနှုန်းသည် ၀ ထက် ကြီးရပါမည်။');
      return;
    }

    const supportedCurrencies = ['MMK', 'THB', 'USD'];
    if (!supportedCurrencies.includes(currency)) {
      await ctx.reply(`⚠️ ${currency} ကို လက်မခံပါ။ (MMK သို့မဟုတ် THB ကို အသုံးပြုပါ)`);
      return;
    }

    ctx.wizard.state.price = { priceAmount: amount, currency };

    await ctx.reply(
      '✨ ပစ္စည်း၏ လက်ရှိအခြေအနေနှင့် အပြစ်အနာဆာများကို ရေးပြပေးပါ -\n\n(ဥပမာ - 90% သန့်၊ အစုတ်အပြဲမရှိ၊ ဘူးပါမည်)'
    );
    ctx.wizard.next();
  },

  // Step 5: Validate Condition -> Ask Contact
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const condition = text.trim();

    if (!condition || condition.length < 1 || condition.length > 500) {
      await ctx.reply('⚠️ ပစ္စည်းအခြေအနေကို မှန်ကန်စွာ ရေးပေးပါ။');
      return;
    }

    ctx.wizard.state.condition = condition;

    await ctx.reply(
      '📞 ဝယ်ယူလိုသူများ ဆက်သွယ်ရန် ဖုန်းနံပါတ် သို့မဟုတ် Telegram Username ကို ရေးပေးပါ -\n\n(ဥပမာ - 09123456789 သို့မဟုတ် @username)'
    );
    ctx.wizard.next();
  },

  // Step 6: Validate Contact -> Ask Photos
  async (ctx) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const contact = text.trim();

    if (!contact || contact.length < 1 || contact.length > 100) {
      await ctx.reply('⚠️ ဆက်သွယ်ရန် လိပ်စာကို မှန်ကန်စွာ ရေးပေးပါ။');
      return;
    }

    ctx.wizard.state.contact = contact;
    ctx.wizard.state.photoFileIds = [];

    await ctx.reply(
      '📸 ပစ္စည်း ဓာတ်ပုံ ပို့ပေးပါ။\n\nအနည်းဆုံး ၁ ပုံ၊ အများဆုံး ၆ ပုံ ပို့နိုင်ပါသည်။\n\nဓာတ်ပုံ ပို့ပြီးပါက အောက်ပါ \'ပြီးပြီ ✅\' ခလုတ်ကို နှိပ်ပါ။',
      Markup.keyboard([['ပြီးပြီ ✅']]).resize()
    );
    ctx.wizard.next();
  },

  // Step 7: Collect Photos or finish
  async (ctx) => {
    const state = ctx.wizard.state;
    if (!state.photoFileIds) state.photoFileIds = [];

    if (ctx.message && 'text' in ctx.message && ctx.message.text === 'ပြီးပြီ ✅') {
      if (state.photoFileIds.length < 1) {
        await ctx.reply('⚠️ အနည်းဆုံး ဓာတ်ပုံ ၁ ပုံ ပို့ပေးရန် လိုအပ်ပါသည်။');
        return;
      }

      await ctx.reply('⏳ သင့်ပစ္စည်းကို စိစစ်ရန် ပို့ပေးနေပါသည်...', Markup.removeKeyboard());
      
      const from = ctx.from;
      if (!from) {
        await ctx.reply('⚠️ အသုံးပြုသူ အချက်အလက်ကို ရယူ၍ မရပါ။');
        return ctx.scene.leave();
      }

      try {
        const id = generateListingId();
        
        await ctx.listingService.createListing({
          id,
          seller_telegram_id: from.id,
          seller_username: from.username || null,
          seller_first_name: from.first_name || null,
          product_name: state.productName!,
          category: state.category!,
          location: state.location!,
          price_amount: state.price!.priceAmount,
          currency: state.price!.currency,
          condition: state.condition!,
          contact: state.contact!,
          photo_file_ids: state.photoFileIds,
        });

        await ctx.reply('✅ သင့်ပစ္စည်းအား အုပ်ထိန်းသူများထံ ပို့ပေးလိုက်ပါပြီ။ အတည်ပြုချက်ရရှိပါက Channel တွင် ဖော်ပြပေးပါမည်။');
      } catch (error) {
        console.error('Listing creation failed', error);
        await ctx.reply('⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်ထပ်ကြိုးစားပါ။');
      }

      return ctx.scene.leave();
    }

    if (ctx.message && 'photo' in ctx.message) {
      if (state.photoFileIds.length >= 6) {
        await ctx.reply('⚠️ ဓာတ်ပုံ အများဆုံး ၆ ပုံသာ ပို့နိုင်ပါသည်။ ပိုပို့၍ မရပါ။');
        return;
      }
      
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      state.photoFileIds.push(largestPhoto.file_id);
      
      await ctx.reply(`✅ ဓာတ်ပုံ လက်ခံရရှိပါပြီ။ (${state.photoFileIds.length}/6)`);
      return;
    }

    await ctx.reply('⚠️ ဓာတ်ပုံသာ ပို့ပေးပါ သို့မဟုတ် ပြီးပြီ ခလုတ်ကို နှိပ်ပါ။');
  }
);