import * as crypto from 'crypto';

export function selectRegime(input: any): string {
  const hash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const regimes = ['default', 'fast', 'accurate', 'balanced'];
  const index = parseInt(hash.slice(0, 8), 16) % regimes.length;
  return regimes[index];
}
