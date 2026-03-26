/**
 * One-time migration script: Encrypt existing partner data in-place.
 * Run: ENCRYPTION_KEY=... npx ts-node scripts/encrypt-partners.ts
 *
 * Safe to run multiple times — already-encrypted fields are detected and skipped.
 */
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../src/common/encryption.util';

const FIELDS = ['taxNumber', 'registrationNumber', 'headquarters', 'representative'] as const;

function isAlreadyEncrypted(value: string): boolean {
  // Encrypted format: hex(iv):hex(authTag):hex(ciphertext)
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts.every(p => /^[0-9a-fA-F]+$/.test(p));
}

async function main() {
  const prisma = new PrismaClient();
  const partners = await prisma.partner.findMany();

  console.log(`Found ${partners.length} partners to check.`);
  let encrypted = 0;
  let skipped = 0;

  for (const partner of partners) {
    const updates: Record<string, string> = {};

    for (const field of FIELDS) {
      const value = (partner as any)[field];
      if (!value || typeof value !== 'string') continue;
      if (isAlreadyEncrypted(value)) {
        // Verify it actually decrypts
        try { decrypt(value); continue; } catch { /* not encrypted, encrypt it */ }
      }
      updates[field] = encrypt(value);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.partner.update({ where: { id: partner.id }, data: updates });
      encrypted++;
      console.log(`  Encrypted: ${partner.companyName} (${Object.keys(updates).join(', ')})`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone! Encrypted: ${encrypted}, Already encrypted/empty: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
