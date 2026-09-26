import { Scenes, Markup } from 'telegraf';
import {
  MyContext,
  Category,
  Location,
  Currency,
} from '../types/listing';

interface WizardState {
  productName?: string;
  category?: Category;
  location?: Location;
  price?: {
    priceAmount: number;
    currency: Currency;
  };
  condition?: string;
  note?: string | null;
  contact?: string;
  photoFileIds?: string[];
  [key: string]: any;
}

const getWizState = (ctx: MyContext): WizardState =>
  ctx.wizard.state as WizardState;

export const sellScene = new Scenes.WizardScene<MyContext>(
  'SELL_SCENE',

  // Step 1: Ask Product Name
  async (ctx) => {
    const state = getWizState(ctx);

    for (const key of Object.keys(state)) {
      delete state[key];
    }

    await ctx.reply(
      '📦 ရောင်းချလိုသော ပစ္စည်း၏ အမည်ကို ရေးပြပေးပါ -'
    );

    return ctx.wizard.next();
  },

  // Step 2: Get Product Name -> Ask Category
  async (ctx) => {
    const text =
      ctx.message && 'text' in ctx.message
        ? ctx.message.text.trim()
        : '';

    if (!text) {
      return ctx.reply(
        '⚠️ ပစ္စည်းအမည်ကို စာသားဖြင့် မှန်ကန်စွာ ရေးပြပေးပါ -'
      );
    }

    const state = getWizState(ctx);
    state.productName = text;

    await ctx.reply(
      '📂 ပစ္စည်း၏ အမျိုးအစားကို ရွေးချယ်ပါ -',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '📱 အီလက်ထရောနစ်',
            Category.ELECTRONICS
          ),
        ],
        [
          Markup.button.callback(
            '👕 အဝတ်အထည်',
            Category.CLOTHING
          ),
        ],
        [
          Markup.button.callback(
            '🏠 အိမ်သုံးပစ္စည်း',
            Category.HOME
          ),
        ],
        [
          Markup.button.callback(
            '🚗 ယာဉ်မောင်းနှင်မှု',
            Category.VEHICLE
          ),
        ],
        [
          Markup.button.callback(
            '📦 အခြား',
            Category.OTHER
          ),
        ],
      ])
    );

    return ctx.wizard.next();
  },

  // Step 3: Handle Category Selection -> Ask Location
  async (ctx) => {
    if (
      !ctx.callbackQuery ||
      !('data' in ctx.callbackQuery)
    ) {
      return ctx.reply(
        '⚠️ ကျေးဇူးပြု၍ ခလုတ်တစ်ခုခုကို ရွေးချယ်ပေးပါ။'
      );
    }

    const category = ctx.callbackQuery.data as Category;

    if (!Object.values(Category).includes(category)) {
      return ctx.reply(
        '⚠️ မမှန်ကန်သော အမျိုးအစား ဖြစ်ပါသည်။'
      );
    }

    const state = getWizState(ctx);
    state.category = category;

    await ctx.answerCbQuery().catch(() => {});

    await ctx.reply(
      '📍 ပစ္စည်းရှိသော မြို့နယ်ကို ရွေးချယ်ပါ -',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '📍 ရွှေက္ကိုလ်',
            Location.SHWE_KOKKO
          ),
        ],
        [
          Markup.button.callback(
            '📍 မြဝတီ',
            Location.MYAWADDY
          ),
        ],
      ])
    );

    return ctx.wizard.next();
  },

  // Step 4: Handle Location Selection -> Ask Price
  async (ctx) => {
    if (
      !ctx.callbackQuery ||
      !('data' in ctx.callbackQuery)
    ) {
      return ctx.reply(
        '⚠️ ကျေးဇူးပြု၍ ခလုတ်တစ်ခုခုကို ရွေးချယ်ပေးပါ။'
      );
    }

    const location = ctx.callbackQuery.data as Location;

    if (!Object.values(Location).includes(location)) {
      return ctx.reply(
        '⚠️ မမှန်ကန်သော မြို့နယ် ဖြစ်ပါသည်။'
      );
    }

    const state = getWizState(ctx);
    state.location = location;

    await ctx.answerCbQuery().catch(() => {});

    await ctx.reply(
      '💰 ဈေးနှုန်းနှင့် ငွေကြေးအမျိုးအစားကို ရေးပေးပါ -\n\n' +
        '(ဥပမာ - 25000 MMK, 500 THB)'
    );

    return ctx.wizard.next();
  },

  // Step 5: Get Price -> Ask Condition
  async (ctx) => {
    const text =
      ctx.message && 'text' in ctx.message
        ? ctx.message.text.trim()
        : '';

    const match = text.match(
      /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/
    );

    if (!match) {
      return ctx.reply(
        '⚠️ ဈေးနှုန်းနှင့် ငွေကြေးကို မှန်ကန်စွာ ရေးပေးပါ။\n' +
          '(ဥပမာ - 20000 MMK)'
      );
    }

    const amount = parseFloat(match[1]);
    const currency = match[2].toUpperCase() as Currency;

    if (
      amount <= 0 ||
      !['MMK', 'THB', 'USD'].includes(currency)
    ) {
      return ctx.reply(
        '⚠️ ဈေးနှုန်းမှားယွင်းနေပါသည်။\n' +
          '(MMK, THB အသုံးပြုပါ)'
      );
    }

    const state = getWizState(ctx);

    state.price = {
      priceAmount: amount,
      currency,
    };

    await ctx.reply(
      '✨ ပစ္စည်း၏ လက်ရှိအခြေအနေကို ရေးပြပေးပါ -\n\n' +
        '(ဥပမာ - 90% သန့်၊ အစုတ်အပြဲမရှိ၊ ဘူးပါမည်)'
    );

    return ctx.wizard.next();
  },

  // Step 6: Get Condition -> Ask Optional Note
  async (ctx) => {
    const text =
      ctx.message && 'text' in ctx.message
        ? ctx.message.text.trim()
        : '';

    if (!text) {
      return ctx.reply(
        '⚠️ အခြေအနေကို စာသားဖြင့် ရေးပေးပါ -'
      );
    }

    const state = getWizState(ctx);
    state.condition = text;

    await ctx.reply(
      '📝 ထပ်မံဖော်ပြလိုသော အချက်အလက်ရှိပါက ရေးပေးပါ။\n\n' +
        'ဥပမာ - မူရင်းဘူးပါသည်၊ ဈေးနှုန်းညှိနှိုင်းနိုင်ပါသည်။\n\n' +
        'မထည့်လိုပါက "ကျော်မည် ⏭️" ခလုတ်ကို နှိပ်ပါ။',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'ကျော်မည် ⏭️',
            'skip_note'
          ),
        ],
      ])
    );

    return ctx.wizard.next();
  },

  // Step 7: Get Optional Note -> Ask Contact
  async (ctx) => {
    const state = getWizState(ctx);

    // Seller chose Skip
    if (
      ctx.callbackQuery &&
      'data' in ctx.callbackQuery &&
      ctx.callbackQuery.data === 'skip_note'
    ) {
      await ctx.answerCbQuery().catch(() => {});

      state.note = null;

      await ctx.reply(
        '📞 ဝယ်ယူလိုသူများ ဆက်သွယ်ရန် ဖုန်းနံပါတ် သို့မဟုတ် Telegram Username ကို ရေးပေးပါ -'
      );

      return ctx.wizard.next();
    }

    // Seller entered a note
    const text =
      ctx.message && 'text' in ctx.message
        ? ctx.message.text.trim()
        : '';

    if (!text) {
      return ctx.reply(
        '⚠️ မှတ်ချက်ကို စာသားဖြင့် ရေးပေးပါ သို့မဟုတ် "ကျော်မည် ⏭️" ကို နှိပ်ပါ။'
      );
    }

    if (text.length > 500) {
      return ctx.reply(
        '⚠️ မှတ်ချက်သည် စာလုံး ၅၀၀ ထက် မပိုရပါ။'
      );
    }

    state.note = text;

    await ctx.reply(
      '📞 ဝယ်ယူလိုသူများ ဆက်သွယ်ရန် ဖုန်းနံပါတ် သို့မဟုတ် Telegram Username ကို ရေးပေးပါ -'
    );

    return ctx.wizard.next();
  },

  // Step 8: Get Contact -> Ask Photos
  async (ctx) => {
    const text =
      ctx.message && 'text' in ctx.message
        ? ctx.message.text.trim()
        : '';

    if (!text) {
      return ctx.reply(
        '⚠️ ဆက်သွယ်ရန် အချက်အလက်ကို ရေးပေးပါ -'
      );
    }

    const state = getWizState(ctx);

    state.contact = text;
    state.photoFileIds = [];

    await ctx.reply(
      '📷 ပစ္စည်းဓာတ်ပုံ ပို့ပေးပါ။\n\n' +
        'အနည်းဆုံး ၁ ပုံ၊ အများဆုံး ၆ ပုံ ပို့နိုင်ပါသည်။\n' +
        'ဓာတ်ပုံ ပို့ပြီးပါက အောက်ပါ "ပြီးပြီ ✅" ခလုတ်ကို နှိပ်ပါ။',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'ပြီးပြီ ✅',
            'photos_done'
          ),
        ],
      ])
    );

    return ctx.wizard.next();
  },

  // Step 9: Receive Photos / Done Action -> Submit
  async (ctx) => {
    const state = getWizState(ctx);

    if (
      ctx.callbackQuery &&
      'data' in ctx.callbackQuery &&
      ctx.callbackQuery.data === 'photos_done'
    ) {
      await ctx.answerCbQuery().catch(() => {});

      const photoIds = state.photoFileIds || [];

      if (photoIds.length === 0) {
        return ctx.reply(
          '⚠️ အနည်းဆုံး ဓာတ်ပုံ ၁ ပုံ ပို့ပေးရန် လိုအပ်ပါသည်။'
        );
      }

      try {
        await ctx.reply(
          '⌛ သင့်ပစ္စည်းကို စိစစ်ရန် ပို့ပေးနေပါသည်...'
        );

        console.log(
          '📝 Creating listing in database...'
        );

        const listing =
          await ctx.listingService.createListing({
            sellerTelegramId: ctx.from!.id,
            sellerUsername:
              ctx.from!.username || null,
            sellerFirstName:
              ctx.from!.first_name || null,
            productName: state.productName!,
            category: state.category!,
            location: state.location!,
            priceAmount:
              state.price!.priceAmount,
            currency:
              state.price!.currency,
            condition: state.condition!,
            note: state.note || null,
            contact: state.contact!,
            photoFileIds: photoIds,
          });

        console.log(
          '✅ Listing created:',
          listing.id
        );

        await ctx.reply(
          '✅ သင့်ပစ္စည်းကို အောင်မြင်စွာ တင်ပြီးပါပြီ။ Admin များ စိစစ်ပြီးပါက Channel တွင် ဖော်ပြပေးပါမည်။'
        );
      } catch (error) {
        console.error(
          '❌ Failed to save listing:',
          error
        );

        if (error instanceof Error) {
          console.error(
            '❌ Error message:',
            error.message
          );

          console.error(
            '❌ Error stack:',
            error.stack
          );
        }

        await ctx.reply(
          '⚠️ စနစ်ပိုင်းဆိုင်ရာ အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ နောက်ထပ်ကြိုးစားပါ။'
        );
      }

      return ctx.scene.leave();
    }

    if (
      ctx.message &&
      'photo' in ctx.message
    ) {
      const photos = ctx.message.photo;
      const largestPhoto =
        photos[photos.length - 1];

      state.photoFileIds =
        state.photoFileIds || [];

      if (state.photoFileIds.length >= 6) {
        return ctx.reply(
          '⚠️ ဓာတ်ပုံ ၆ ပုံထက် ပို၍ မတင်နိုင်ပါ။ "ပြီးပြီ ✅" ခလုတ်ကို နှိပ်ပါ။'
        );
      }

      state.photoFileIds.push(
        largestPhoto.file_id
      );

      await ctx.reply(
        `✅ ဓာတ်ပုံ လက်ခံရရှိပါပြီ။ (${state.photoFileIds.length}/6)`
      );

      return;
    }

    return ctx.reply(
      '⚠️ ဓာတ်ပုံ ပို့ပေးပါ သို့မဟုတ် "ပြီးပြီ ✅" ခလုတ်ကို နှိပ်ပါ။'
    );
  }
);