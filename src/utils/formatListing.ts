import {
  Listing,
  Category,
  Location,
  ListingAvailability,
} from '../types/listing';

const categoryNames: Record<string, string> = {
  [Category.ELECTRONICS]: 'အီလက်ထရောနစ်',
  [Category.CLOTHING]: 'အဝတ်အထည်',
  [Category.HOME]: 'အိမ်သုံးပစ္စည်း',
  [Category.VEHICLE]: 'ယာဉ်မောင်းနှင်မှု',
  [Category.OTHER]: 'အခြား',
};

const locationNames: Record<string, string> = {
  [Location.SHWE_KOKKO]: 'ရွှေက္ကိုလ်',
  [Location.MYAWADDY]: 'မြဝတီ',
};

function escapeHtml(
  value: string | null | undefined
): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toHashtag(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(
      /[^a-zA-Z0-9_က-၉]/g,
      ''
    );
}

export function formatListingMessage(
  listing: Listing
): string {
  const categoryLabel =
    categoryNames[listing.category] ||
    listing.category;

  const locationLabel =
    locationNames[listing.location] ||
    listing.location;

  const categoryHashtag =
    toHashtag(categoryLabel);

  const locationHashtag =
    toHashtag(locationLabel);

  const availability =
    listing.availability ===
    ListingAvailability.SOLD_OUT
      ? '🔴 <b>Sold Out</b>'
      : '🟢 <b>Available</b>';

  const noteSection = listing.note
    ? `\n📝 <b>မှတ်ချက်:</b> ${escapeHtml(listing.note)}\n`
    : '';

  return (
    `<b>📌 ${escapeHtml(
      listing.productName
    )}</b>\n\n` +

    `💰 <b>ဈေးနှုန်း:</b> ` +
    `${escapeHtml(
      String(listing.priceAmount)
    )} ${escapeHtml(
      listing.currency
    )}\n` +

    `📦 <b>အခြေအနေ:</b> ` +
    `${escapeHtml(
      listing.condition
    )}\n` +

    `📍 <b>နေရာ:</b> ` +
    `${escapeHtml(locationLabel)}\n` +

    noteSection +

    `📞 <b>ဆက်သွယ်ရန်:</b> ` +
    `${escapeHtml(listing.contact)}\n\n` +

    `🏷️ #${categoryHashtag} #${locationHashtag}\n` +

    `${availability}`
  );
}