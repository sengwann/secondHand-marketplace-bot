import crypto from 'crypto';

export function generateListingId(): string {
  return `SK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}