import { Context } from 'telegraf';
import { config } from '../config';

export function isAdmin(ctx: Context): boolean {
  if (!ctx.from) return false;
  return config.adminUserIds.includes(ctx.from.id);
}

export function isAdminChat(ctx: Context): boolean {
  if (!ctx.chat) return false;
  return ctx.chat.id.toString() === config.adminChatId.toString();
}