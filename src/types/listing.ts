import { Context, Scenes } from 'telegraf';
import { ListingService } from '../services/listing.service';
import { SettingService } from '../services/setting.service';

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

export type Currency = 'MMK' | 'THB';

export interface Price {
  priceAmount: number;
  currency: Currency;
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
  listingService: ListingService;
  settingService: SettingService;
}