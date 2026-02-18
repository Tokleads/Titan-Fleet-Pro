import { db } from './db';
import { users, companies } from '@shared/schema';
import { eq, and, ne, sql } from 'drizzle-orm';

export async function generateUniquePin(companyId: number): Promise<string> {
  const existingUsers = await db
    .select({ pin: users.pin })
    .from(users)
    .where(eq(users.companyId, companyId));

  const existingPins = new Set(
    existingUsers.map((u) => u.pin).filter((p): p is string => p !== null)
  );

  if (existingPins.size >= 9000) {
    throw new Error('All PINs are taken for this company');
  }

  let pin: string;
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    pin = String(num).padStart(4, '0');
  } while (existingPins.has(pin));

  return pin;
}

export async function generateUniquePins(companyId: number, count: number): Promise<string[]> {
  const existingUsers = await db
    .select({ pin: users.pin })
    .from(users)
    .where(eq(users.companyId, companyId));

  const existingPins = new Set(
    existingUsers.map((u) => u.pin).filter((p): p is string => p !== null)
  );

  if (existingPins.size + count > 9000) {
    throw new Error(`Cannot generate ${count} unique PINs. Only ${9000 - existingPins.size} available.`);
  }

  const newPins: string[] = [];
  const allUsed = new Set(existingPins);

  while (newPins.length < count) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const pin = String(num).padStart(4, '0');
    if (!allUsed.has(pin)) {
      allUsed.add(pin);
      newPins.push(pin);
    }
  }

  return newPins;
}

export async function validatePinAvailable(companyId: number, pin: string, excludeUserId?: number): Promise<boolean> {
  const conditions = [
    eq(users.companyId, companyId),
    eq(users.pin, pin),
  ];

  if (excludeUserId !== undefined) {
    conditions.push(ne(users.id, excludeUserId));
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export async function generateUniqueCompanyCode(baseName: string): Promise<string> {
  const alphaOnly = baseName.replace(/[^a-zA-Z]/g, '');
  const codeBase = alphaOnly.substring(0, 4).toUpperCase();

  for (let attempt = 0; attempt < 20; attempt++) {
    const digitLength = 2 + Math.floor(attempt / 5);
    const min = Math.pow(10, digitLength - 1);
    const max = Math.pow(10, digitLength);
    const randomNum = Math.floor(min + Math.random() * (max - min));
    const code = `${codeBase}${randomNum}`;

    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.companyCode, code))
      .limit(1);

    if (existing.length === 0) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique company code after 20 attempts');
}
