import { Context, Scenes } from 'telegraf';
import { ListingService } from '../services/listing.service';
import { SettingService } from '../services/setting.service';

export enum ListingStatus {
  PENDING = 'PENDING',
  APPROVING = 'APPROVING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ListingAvailability {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
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

export type Currency = 'MMK' | 'THB';

export interface Price {
  priceAmount: number;
  currency: Currency;
}

export interface Listing {
  id: string;
  sellerTelegramId: number | bigint;
  sellerUsername: string | null;
  sellerFirstName: string | null;
  productName: string;
  category: Category | string;
  location: Location | string;
  priceAmount: number;
  currency: Currency | string;
  condition: string;
  note?: string | null;
  contact: string;
  photoFileIds: string[];
  status: ListingStatus | string;
  availability: ListingAvailability | string;
  rejectionReason?: string | null;
  channelMessageId?: number | bigint | null;
  createdAt?: Date;
}

export interface WizardSessionData extends Scenes.WizardSessionData {
  productName?: string;
  category?: Category;
  location?: Location;
  price?: Price;
  condition?: string;
  note?: string;
  contact?: string;
  photoFileIds?: string[];
}

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, WizardSessionData>;
  session: Scenes.WizardSession<WizardSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext>;
  listingService: ListingService;
  settingService: SettingService;
}