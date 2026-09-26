import { SettingRepository } from '../db/setting.repository';

const RULES_KEY = 'MARKETPLACE_RULES';

const DEFAULT_RULES = `📜 စည်းကမ်းချက်များ

၁။ မိမိပိုင်ဆိုင်သော ပစ္စည်းများကိုသာ ရောင်းချရပါမည်။
၂။ ဥပဒေနှင့် ငြိစွန်းသော ပစ္စည်းများ လုံးဝ တင်ခြင်းမရှိရ။
၃။ ဝယ်သူနှင့် ရောင်းသူ အချင်းချင်း ငွေကြေးလိမ်လည်မှုများအတွက် Admin များကို သတင်းပေးပို့ရပါမည်။
၄။ လူချင်းတွေ့ဆုံ၍ ပစ္စည်းသေချာ စစ်ဆေးပြီးမှသာ ငွေချေပါရန် အကြံပြုအပ်ပါသည်။
၅။ Bot အသုံးပြုမှုနှင့် ပတ်သက်၍ မမှန်ကန်သော အချက်အလက်များ တင်ခြင်းမပြုရ။`;

export class SettingService {
  private cachedRules: string | null = null;

  async getRules(): Promise<string> {
    if (this.cachedRules) {
      return this.cachedRules;
    }
    const dbRules = await SettingRepository.get(RULES_KEY);
    if (!dbRules) {
      await SettingRepository.set(RULES_KEY, DEFAULT_RULES);
      this.cachedRules = DEFAULT_RULES;
      return DEFAULT_RULES;
    }
    this.cachedRules = dbRules;
    return dbRules;
  }

  async updateRules(newRules: string): Promise<string> {
    const updated = await SettingRepository.set(RULES_KEY, newRules);
    this.cachedRules = updated; // Invalidate and update cache
    return updated;
  }
}
