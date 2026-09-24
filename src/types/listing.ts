import { Context, Scenes } from 'telegraf';

export enum ListingStatus {
  PENDING = 'PENDING',
  APPROVING = 'APPROVING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Category {
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  HOME = 'HOME',
  VEHICLE = 'VEHICLE',
  OTHER = 'OTHER',
}

export enum Location {
  SHWE_KOKKO = 'SHWE_KOKKO',
  MYAWADDY = 'MYAWADDY',
}

export interface Price {
  priceAmount: number;
  currency: string;
}

export interface Listing {
  id: string;
  seller_telegram_id: number;
  seller_username: string | null;
  seller_first_name: string | null;
  product_name: string;
  category: Category;
  location: Location;
  price_amount: number;
  currency: string;
  condition: string;
  contact: string;
  photo_file_ids: string[];
  status: ListingStatus;
  rejection_reason: string | null;
  channel_message_id: number | null;
  created_at: number;
}

export interface WizardSessionData extends Scenes.WizardSessionData {
  productName?: string;
  category?: Category;
  location?: Location;
  price?: Price;
  condition?: string;
  contact?: string;
  photoFileIds?: string[];
}

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, WizardSessionData>;
  session: Scenes.WizardSession<WizardSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext>;
  listingService: import('../services/listing.service').ListingService;
}