import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

function parseAdminIds(ids: string): number[] {
  return ids.split(',').map(id => {
    const parsed = parseInt(id.trim(), 10);
    if (isNaN(parsed)) {
      throw new Error(`❌ Invalid ADMIN_USER_IDS format: ${id}`);
    }
    return parsed;
  });
}

export const config = {
  botToken: requireEnv('BOT_TOKEN'),
  adminChatId: requireEnv('ADMIN_CHAT_ID'),
  channelId: requireEnv('CHANNEL_ID'),
  adminUserIds: parseAdminIds(requireEnv('ADMIN_USER_IDS')),
  channelName: requireEnv('CHANNEL_NAME'),
  databasePath: requireEnv('DATABASE_PATH'),
};