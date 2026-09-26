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

  // Used when editing a field from the review screen
  editingField?: string;

  [key: string]: any;
}

const getWizState = (ctx: MyContext): WizardState =>
  ctx.wizard.state as WizardState;

function escapeHtml(
  value: string | number | null | undefined
): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCategoryLabel(category?: Category): string {
  const labels: Record<string, string> = {
    [Category.ELECTRONICS]: '📱 အီလက်ထရောနစ်',
    [Category.CLOTHING]: '👕 အဝတ်အထည်',
    [Category.HOME]: '🏠 အိမ်သုံးပစ္စည်း',
    [Category.VEHICLE]: '🚗 ယာဉ်မောင်းနှင်မှု',
    [Category.OTHER]: '📦 အခြား',
  };

  return labels[category || ''] || category || 'မရှိပါ';
}

function getLocationLabel(location?: Location): string {
  const labels: Record<string, string> = {
    [Location.SHWE_KOKKO]: '📍 ရွှေက္ကိုလ်',
    [Location.MYAWADDY]: '📍 မြဝတီ',
  };

  return labels[location || ''] || location || 'မရှိပါ';
}

function getReviewMessage(state: WizardState): string {
  const photoCount = state.photoFileIds?.length || 0;

  return (
    `📋 <b>ပစ္စည်းအချက်အလက်များကို စစ်ဆေးပါ</b>\n\n` +
    `📦 <b>ပစ္စည်းအမည်:</b> ${escapeHtml(
      state.productName
    )}\n` +
    `🏷️ <b>အမျိုးအစား:</b> ${escapeHtml(
      getCategoryLabel(state.category)
    )}\n` +
    `📍 <b>နေရာ:</b> ${escapeHtml(
      getLocationLabel(state.location)
    )}\n` +
    `💰 <b>ဈေးနှုန်း:</b> ${escapeHtml(
      state.price?.priceAmount
    )} ${escapeHtml(state.price?.currency)}\n` +
    `📦 <b>အခြေအနေ:</b> ${escapeHtml(
      state.condition
    )}\n` +
    `📝 <b>မှတ်ချက်:</b> ${escapeHtml(
      state.note || 'မရှိပါ'
    )}\n` +
    `📞 <b>ဆက်သွယ်ရန်:</b> ${escapeHtml(
      state.contact
    )}\n` +
    `📷 <b>ဓာတ်ပုံ:</b> ${photoCount} ပုံ\n\n` +
    `အချက်အလက်များ မှန်ကန်ပါက <b>တင်မည်</b> ကို နှိပ်ပါ။\n` +
    `ပြင်ဆင်လိုပါက အောက်ပါခလုတ်မှ ရွေးချယ်ပါ။`
  );
}

function getReviewKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        '✏️ အမည်ပြင်မည်',
        'edit_product'
      ),
    ],
    [
      Markup.button.callback(
        '✏️ အမျိုးအစားပြင်မည်',
        'edit_category'
      ),
      Markup.button.callback(
        '✏️ နေရာပြင်မည်',
        'edit_location'
      ),
    ],
    [
      Markup.button.callback(
        '✏️ ဈေးနှုန်းပြင်မည်',
        'edit_price'
      ),
      Markup.button.callback(
        '✏️ အခြေအနေပြင်မည်',
        'edit_condition'
      ),
    ],
    [
      Markup.button.callback(
        '✏️ မှတ်ချက်ပြင်မည်',
        'edit_note'
      ),
      Markup.button.callback(
        '✏️ ဆက်သွယ်ရန်ပြင်မည်',
        'edit_contact'
      ),
    ],
    [
      Markup.button.callback(
        '📷 ဓာတ်ပုံပြင်မည်',
        'edit_photos'
      ),
    ],
    [
      Markup.button.callback(
        '✅ တင်မည်',
        'submit_listing'
      ),
      Markup.button.callback(
        '❌ ပယ်ဖျက်မည်',
        'cancel_listing'
      ),
    ],
  ]);
}

async function showReview(ctx: MyContext) {
  const state = getWizState(ctx);

  await ctx.reply(
    getReviewMessage(state),
    {
      parse_mode: 'HTML',
      ...getReviewKeyboard(),
    }
  );
}

export const sellScene = new Scenes.WizardScene<MyContext>(
  'SELL_SCENE',

  // =========================================================
  // Step 1: Start -> Ask Product Name
  // =========================================================
  async (ctx) => {
    const state = getWizState(ctx);

    // Clear old listing data
    for (const key of Object.keys(state)) {
      delete state[key];
    }

    await ctx.reply(
      '📦 ရောင်းချလိုသော ပစ္စည်း၏ အမည်ကို ရေးပြပေးပါ -'
    );

    return ctx.wizard.next();
  },

  // =========================================================
  // Step 2: Get Product Name -> Ask Category
  // =========================================================
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

  // =========================================================
  // Step 3: Category -> Ask Location
  // =========================================================
  async (ctx) => {
    if (
      !ctx.callbackQuery ||
      !('data' in ctx.callbackQuery)
    ) {
      return ctx.reply(
        '⚠️ ကျေးဇူးပြု၍ အမျိုးအစားခလုတ်တစ်ခုကို ရွေးချယ်ပေးပါ။'
      );
    }

    const category =
      ctx.callbackQuery.data as Category;

    if (
      !Object.values(Category).includes(category)
    ) {
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

  // =========================================================
  // Step 4: Location -> Ask Price
  // =========================================================
  async (ctx) => {
    if (
      !ctx.callbackQuery ||
      !('data' in ctx.callbackQuery)
    ) {
      return ctx.reply(
        '⚠️ ကျေးဇူးပြု၍ မြို့နယ်ခလုတ်တစ်ခုကို ရွေးချယ်ပေးပါ။'
      );
    }

    const location =
      ctx.callbackQuery.data as Location;

    if (
      !Object.values(Location).includes(location)
    ) {
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

  // =========================================================
  // Step 5: Price -> Ask Condition
  // =========================================================
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
    const currency =
      match[2].toUpperCase() as Currency;

    if (
      amount <= 0 ||
      !['MMK', 'THB', 'USD'].includes(currency)
    ) {
      return ctx.reply(
        '⚠️ ဈေးနှုန်းမှားယွင်းနေပါသည်။\n' +
          '(MMK, THB, USD အသုံးပြုပါ)'
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

  // =========================================================
  // Step 6: Condition -> Ask Optional Note
  // =========================================================
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

  // =========================================================
  // Step 7: Note -> Ask Contact
  // =========================================================
  async (ctx) => {
    const state = getWizState(ctx);

    // Skip note
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

    // Enter note
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

  // =========================================================
  // Step 8: Contact -> Ask Photos
  // =========================================================
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

  // =========================================================
  // Step 9: Photos -> Show Review
  // =========================================================
  async (ctx) => {
    const state = getWizState(ctx);

    // Seller clicked "Done"
    if (
      ctx.callbackQuery &&
      'data' in ctx.callbackQuery &&
      ctx.callbackQuery.data === 'photos_done'
    ) {
      await ctx.answerCbQuery().catch(() => {});

      const photoIds =
        state.photoFileIds || [];

      if (photoIds.length === 0) {
        return ctx.reply(
          '⚠️ အနည်းဆုံး ဓာတ်ပုံ ၁ ပုံ ပို့ပေးရန် လိုအပ်ပါသည်။'
        );
      }

      // IMPORTANT:
      // Don't create the listing yet.
      // Show the review screen first.
      await showReview(ctx);

      return ctx.wizard.next();
    }

    // Receive photo
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
  },

  // =========================================================
  // Step 10: Review / Edit
  // =========================================================
  async (ctx) => {
    const state = getWizState(ctx);

    if (
      !ctx.callbackQuery ||
      !('data' in ctx.callbackQuery)
    ) {
      return ctx.reply(
        '⚠️ အောက်ပါခလုတ်များထဲမှ တစ်ခုကို ရွေးချယ်ပေးပါ။'
      );
    }

    const action =
      ctx.callbackQuery.data;

    await ctx.answerCbQuery().catch(() => {});

    // -------------------------------------------------------
    // Submit listing
    // -------------------------------------------------------
    if (action === 'submit_listing') {
      try {
        await ctx.reply(
          '⌛ သင့်ပစ္စည်းကို စိစစ်ရန် ပို့ပေးနေပါသည်...'
        );

        console.log(
          '📝 Creating listing in database...'
        );

        const listing =
          await ctx.listingService.createListing({
            sellerTelegramId:
              ctx.from!.id,

            sellerUsername:
              ctx.from!.username || null,

            sellerFirstName:
              ctx.from!.first_name || null,

            productName:
              state.productName!,

            category:
              state.category!,

            location:
              state.location!,

            priceAmount:
              state.price!.priceAmount,

            currency:
              state.price!.currency,

            condition:
              state.condition!,

            note:
              state.note || null,

            contact:
              state.contact!,

            photoFileIds:
              state.photoFileIds || [],
          });

        console.log(
          '✅ Listing created:',
          listing.id
        );

        await ctx.reply(
          '✅ သင့်ပစ္စည်းကို အောင်မြင်စွာ တင်ပြီးပါပြီ။ Admin များ စိစစ်ပြီးပါက Channel တွင် ဖော်ပြပေးပါမည်။'
        );

        return ctx.scene.leave();
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

        return;
      }
    }

    // -------------------------------------------------------
    // Cancel listing
    // -------------------------------------------------------
    if (action === 'cancel_listing') {
      await ctx.reply(
        '❌ ပစ္စည်းတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါပြီ။'
      );

      return ctx.scene.leave();
    }

    // -------------------------------------------------------
    // Edit Product
    // -------------------------------------------------------
    if (action === 'edit_product') {
      state.editingField = 'product';

      await ctx.reply(
        '📦 ပစ္စည်းအမည်အသစ်ကို ရေးပေးပါ -'
      );

      return ctx.wizard.selectStep(1);
    }

    // -------------------------------------------------------
    // Edit Category
    // -------------------------------------------------------
    if (action === 'edit_category') {
      await ctx.reply(
        '📂 ပစ္စည်း၏ အမျိုးအစားအသစ်ကို ရွေးချယ်ပါ -',
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '📱 အီလက်ထရောနစ်',
              'edit_category_electronics'
            ),
          ],
          [
            Markup.button.callback(
              '👕 အဝတ်အထည်',
              'edit_category_clothing'
            ),
          ],
          [
            Markup.button.callback(
              '🏠 အိမ်သုံးပစ္စည်း',
              'edit_category_home'
            ),
          ],
          [
            Markup.button.callback(
              '🚗 ယာဉ်',
              'edit_category_vehicle'
            ),
          ],
          [
            Markup.button.callback(
              '📦 အခြား',
              'edit_category_other'
            ),
          ],
        ])
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Location
    // -------------------------------------------------------
    if (action === 'edit_location') {
      await ctx.reply(
        '📍 ပစ္စည်းရှိသော မြို့နယ်အသစ်ကို ရွေးချယ်ပါ -',
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '📍 ရွှေက္ကိုလ်',
              'edit_location_shwe'
            ),
          ],
          [
            Markup.button.callback(
              '📍 မြဝတီ',
              'edit_location_myawaddy'
            ),
          ],
        ])
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Price
    // -------------------------------------------------------
    if (action === 'edit_price') {
      state.editingField = 'price';

      await ctx.reply(
        '💰 ဈေးနှုန်းနှင့် ငွေကြေးအမျိုးအစားအသစ်ကို ရေးပေးပါ -\n\n' +
          '(ဥပမာ - 25000 MMK, 500 THB)'
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Condition
    // -------------------------------------------------------
    if (action === 'edit_condition') {
      state.editingField = 'condition';

      await ctx.reply(
        '✨ ပစ္စည်း၏ လက်ရှိအခြေအနေအသစ်ကို ရေးပေးပါ -'
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Note
    // -------------------------------------------------------
    if (action === 'edit_note') {
      state.editingField = 'note';

      await ctx.reply(
        '📝 မှတ်ချက်အသစ်ကို ရေးပေးပါ။\n\n' +
          'မှတ်ချက်မထည့်လိုပါက "မရှိပါ" ဟု ရေးပါ။'
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Contact
    // -------------------------------------------------------
    if (action === 'edit_contact') {
      state.editingField = 'contact';

      await ctx.reply(
        '📞 ဖုန်းနံပါတ် သို့မဟုတ် Telegram Username အသစ်ကို ရေးပေးပါ -'
      );

      return ctx.wizard.selectStep(10);
    }

    // -------------------------------------------------------
    // Edit Photos
    // -------------------------------------------------------
    if (action === 'edit_photos') {
      state.photoFileIds = [];

      await ctx.reply(
        '📷 ဓာတ်ပုံအသစ်များ ပို့ပေးပါ။\n\n' +
          'အနည်းဆုံး ၁ ပုံ၊ အများဆုံး ၆ ပုံ ပို့နိုင်ပါသည်။\n' +
          'ဓာတ်ပုံများ ပို့ပြီးပါက "ဓာတ်ပုံပြီးပြီ ✅" ကို နှိပ်ပါ။',
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              'ဓာတ်ပုံပြီးပြီ ✅',
              'edit_photos_done'
            ),
          ],
        ])
      );

      return ctx.wizard.selectStep(10);
    }

    // =======================================================
    // Edit Category Selection
    // =======================================================

    if (
      action === 'edit_category_electronics' ||
      action === 'edit_category_clothing' ||
      action === 'edit_category_home' ||
      action === 'edit_category_vehicle' ||
      action === 'edit_category_other'
    ) {
      const categoryMap: Record<
        string,
        Category
      > = {
        edit_category_electronics:
          Category.ELECTRONICS,

        edit_category_clothing:
          Category.CLOTHING,

        edit_category_home:
          Category.HOME,

        edit_category_vehicle:
          Category.VEHICLE,

        edit_category_other:
          Category.OTHER,
      };

      state.category =
        categoryMap[action];

      await showReview(ctx);

      return;
    }

    // =======================================================
    // Edit Location Selection
    // =======================================================

    if (
      action === 'edit_location_shwe' ||
      action === 'edit_location_myawaddy'
    ) {
      const locationMap: Record<
        string,
        Location
      > = {
        edit_location_shwe:
          Location.SHWE_KOKKO,

        edit_location_myawaddy:
          Location.MYAWADDY,
      };

      state.location =
        locationMap[action];

      await showReview(ctx);

      return;
    }

    // =======================================================
    // Edit Photos Done
    // =======================================================

    if (action === 'edit_photos_done') {
      if (
        !state.photoFileIds ||
        state.photoFileIds.length === 0
      ) {
        return ctx.reply(
          '⚠️ အနည်းဆုံး ဓာတ်ပုံ ၁ ပုံ ပို့ပေးရန် လိုအပ်ပါသည်။'
        );
      }

      await showReview(ctx);

      return;
    }

    return ctx.reply(
      '⚠️ မမှန်ကန်သော ရွေးချယ်မှု ဖြစ်ပါသည်။'
    );
  }
);

// =============================================================
// Important: Handle text edits while on Review step
// =============================================================

sellScene.on('text', async (ctx) => {
  const state = getWizState(ctx);

  if (!state.editingField) {
    return;
  }

  const text =
    ctx.message && 'text' in ctx.message
      ? ctx.message.text.trim()
      : '';

  if (!text) {
    return ctx.reply(
      '⚠️ စာသားတစ်ခု ရေးပေးပါ။'
    );
  }

  switch (state.editingField) {
    case 'product':
      state.productName = text;
      break;

    case 'price': {
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
      const currency =
        match[2].toUpperCase() as Currency;

      if (
        amount <= 0 ||
        !['MMK', 'THB', 'USD'].includes(currency)
      ) {
        return ctx.reply(
          '⚠️ ဈေးနှုန်းမှားယွင်းနေပါသည်။\n' +
            '(MMK, THB, USD အသုံးပြုပါ)'
        );
      }

      state.price = {
        priceAmount: amount,
        currency,
      };

      break;
    }

    case 'condition':
      state.condition = text;
      break;

    case 'note':
      if (text.length > 500) {
        return ctx.reply(
          '⚠️ မှတ်ချက်သည် စာလုံး ၅၀၀ ထက် မပိုရပါ။'
        );
      }

      state.note =
        text === 'မရှိပါ'
          ? null
          : text;

      break;

    case 'contact':
      state.contact = text;
      break;

    default:
      return ctx.reply(
        '⚠️ ပြင်ဆင်ရန် အချက်အလက်ကို မတွေ့ပါ။'
      );
  }

  state.editingField = undefined;

  await showReview(ctx);
});

// =============================================================
// Handle photos while editing photos
// =============================================================

sellScene.on('photo', async (ctx) => {
  const state = getWizState(ctx);

  // Only process photos if seller is editing photos
  if (!state.editingField) {
    return;
  }

  if (
    state.editingField !== 'photos'
  ) {
    return;
  }

  const photos = ctx.message.photo;
  const largestPhoto =
    photos[photos.length - 1];

  state.photoFileIds =
    state.photoFileIds || [];

  if (state.photoFileIds.length >= 6) {
    return ctx.reply(
      '⚠️ ဓာတ်ပုံ ၆ ပုံထက် ပို၍ မတင်နိုင်ပါ။'
    );
  }

  state.photoFileIds.push(
    largestPhoto.file_id
  );

  await ctx.reply(
    `✅ ဓာတ်ပုံ လက်ခံရရှိပါပြီ။ (${state.photoFileIds.length}/6)`
  );
});