import { timingSafeEqual } from "node:crypto";
import { compareSync, hashSync } from "bcryptjs";

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = /^\$2[abxy]?\$/;
/** Fixed hash so missing accounts still pay a bcrypt compare. */
const TIMING_DUMMY_HASH =
  "$2b$10$AvOAakleaYoFpv1.oKeokuMDVd9zIBRGbJ4uTP8uhMpucN48B.B0W";

export function isPasswordHash(value: string): boolean {
  return BCRYPT_PREFIX.test(value);
}

export function hashPassword(plain: string): string {
  return hashSync(plain, BCRYPT_ROUNDS);
}

/** Hash plaintext; leave an existing bcrypt hash unchanged. */
export function toPasswordHash(value: string): string {
  return isPasswordHash(value) ? value : hashPassword(value);
}

function plaintextEquals(stored: string, candidate: string): boolean {
  const left = Buffer.from(stored, "utf8");
  const right = Buffer.from(candidate, "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function passwordMatches(
  stored: string | null | undefined,
  candidate: string,
): boolean {
  if (stored == null) {
    compareSync(candidate, TIMING_DUMMY_HASH);
    return false;
  }
  if (isPasswordHash(stored)) {
    return compareSync(candidate, stored);
  }
  return plaintextEquals(stored, candidate);
}
