import { prisma } from './prisma';

export const SettingRepository = {
  get: async (key: string): Promise<string | null> => {
    const setting = await prisma.appSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : null;
  },

  set: async (key: string, value: string): Promise<string> => {
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return setting.value;
  },
};