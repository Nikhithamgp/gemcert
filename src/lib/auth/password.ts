import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummyHash: Promise<string> | undefined;

/** Compares against a throwaway hash so unknown emails take as long as wrong passwords. */
export async function burnPasswordCheck(plain: string): Promise<false> {
  dummyHash ??= bcrypt.hash("timing-equaliser-not-a-password", ROUNDS);
  await bcrypt.compare(plain, await dummyHash);
  return false;
}
