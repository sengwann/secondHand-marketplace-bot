import { Listing, Category, Location } from '../types/listing';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

  return `🆕 ပစ္စည်းအသစ် ရောင်းရန်ရှိသည်
━━━━━━━━━━━━━━━━━━━━

🛍 ပစ္စည်း - ${escapeHtml(listing.product_name)}
📂 အမျိုးအစား - ${escapeHtml(catLabel)}
📍 တည်နေရာ - #${escapeHtml(locLabel)}
💰 ရောင်းဈေး - ${listing.price_amount} ${escapeHtml(listing.currency)}
✨ အခြေအနေ - ${escapeHtml(listing.condition)}
📞 ဆက်သွယ်ရန် - ${escapeHtml(listing.contact)}

🆔 Listing ID: #${escapeHtml(listing.id)}

#${escapeHtml(listing.category)} #${escapeHtml(locLabel.replace(/\s+/g, ''))} #Available

⚠️ သတိပေးချက်: လူချင်းတွေ့ဆုံ၍ ပစ္စည်းသေချာ စစ်ဆေးပြီးမှ ငွေချေပါ။`;
}