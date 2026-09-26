import { Listing, Category, Location } from '../types/listing';

const categoryNames: Record<string, string> = {
  [Category.ELECTRONICS]: '📱 အီလက်ထရောနစ်',
  [Category.CLOTHING]: '👕 အဝတ်အထည်',
  [Category.HOME]: '🏠 အိမ်သုံးပစ္စည်း',
  [Category.VEHICLE]: '🚗 ယာဉ်မောင်းနှင်မှု',
  [Category.OTHER]: '📦 အခြား',
};

const locationNames: Record<string, string> = {
  [Location.SHWE_KOKKO]: '📍 ရွှေက္ကိုလ်',
  [Location.MYAWADDY]: '📍 မြဝတီ',
};

export function formatListingMessage(listing: Listing): string {
  const categoryLabel = categoryNames[listing.category] || listing.category;
  const locationLabel = locationNames[listing.location] || listing.location;

  return (
    `<b>📌 ${listing.productName}</b>\n\n` +
    `<b>အမျိုးအစား:</b> ${categoryLabel}\n` +
    `<b>မြို့နယ်:</b> ${locationLabel}\n` +
    `<b>ဈေးနှုန်း:</b> ${listing.priceAmount} ${listing.currency}\n` +
    `<b>အခြေအနေ:</b> ${listing.condition}\n` +
    `<b>ဆက်သွယ်ရန်:</b> ${listing.contact}`
  );
}