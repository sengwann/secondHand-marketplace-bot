import crypto from 'crypto';

export function generateListingId(): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SK-${random}`;
}