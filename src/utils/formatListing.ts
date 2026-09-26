import { Listing, Category, Location } from '../types/listing';
import { escapeHtml } from './htmlEscape';

const categoryLabels: Record<Category, string> = {
  [Category.ELECTRONICS]: '📱 ဖုန်း/လျှပ်စစ်',
  [Category.CLOTHING]: '👕 အဝတ်အထည်/ဖိနပ်',
  [Category.HOME]: '🏠 အိမ်သုံးပစ္စည်း',
  [Category.VEHICLE]: '🛵 ယာဉ်/ဆိုင်ကယ်',
  [Category.OTHER]: '📦 အခြား',
};

const locationLabels: Record<Location, string> = {
  [Location.SHWE_KOKKO]: 'ရွှေက္ကိုလ်',
  [Location.MYAWADDY]: 'မြဝတီ',
};

export function formatListing(listing: Listing): string {
  const catLabel = categoryLabels[listing.category] || listing.category;
  const locLabel = locationLabels[listing.location] || listing.location;

  return `🆕 ပစ္စည်းအသစ် ရောင်းရန်ရှိသည်\n━━━━━━━━━━━━━━━━━━━━\n\n` +
         `🛍 ပစ္စည်း - ${escapeHtml(listing.product_name)}\n` +
         `📂 အမျိုးအစား - ${escapeHtml(catLabel)}\n` +
         `📍 တည်နေရာ - #${escapeHtml(locLabel)}\n` +
         `💰 ရောင်းဈေး - ${listing.price_amount} ${escapeHtml(listing.currency)}\n` +
         `✨ အခြေအနေ - ${escapeHtml(listing.condition)}\n` +
         `📞 ဆက်သွယ်ရန် - ${escapeHtml(listing.contact)}\n\n` +
         `🆔 Listing ID: #${escapeHtml(listing.id)}\n\n` +
         `#${escapeHtml(listing.category)} #${escapeHtml(locLabel.replace(/\s+/g, ''))} #Available\n\n` +
         `⚠️ သတိပေးချက်: လူချင်းတွေ့ဆုံ၍ ပစ္စည်းသေချာ စစ်ဆေးပြီးမှ ငွေချေပါ။`;
}
