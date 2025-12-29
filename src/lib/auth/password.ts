// Web Crypto API-based password hashing for Cloudflare Workers compatibility
// Uses PBKDF2 with SHA-256

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedKey = await deriveKey(password, salt);
  const saltHex = bufferToHex(salt.buffer);
  const keyHex = bufferToHex(derivedKey);
  return `${saltHex}:${keyHex}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Handle bcrypt hashes (legacy) - they start with $2a$ or $2b$
  if (hash.startsWith("$2")) {
    // For bcrypt hashes, we need to use a timing-safe comparison
    // Since we can't verify bcrypt in Workers, we'll need to migrate passwords
    // For now, return false and force password reset
    console.warn("Legacy bcrypt hash detected - user needs to reset password");
    return false;
  }

  const [saltHex, storedKeyHex] = hash.split(":");
  if (!saltHex || !storedKeyHex) {
    return false;
  }

  const salt = hexToBuffer(saltHex);
  const derivedKey = await deriveKey(password, salt);
  const derivedKeyHex = bufferToHex(derivedKey);

  // Timing-safe comparison
  if (derivedKeyHex.length !== storedKeyHex.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < derivedKeyHex.length; i++) {
    result |= derivedKeyHex.charCodeAt(i) ^ storedKeyHex.charCodeAt(i);
  }
  return result === 0;
}

// Validate password strength
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true };
}
