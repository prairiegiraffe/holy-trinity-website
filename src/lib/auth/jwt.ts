import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "@/types/cms";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string
): Promise<string> {
  const secretKey = getSecretKey(secret);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretKey);
}

export async function createRefreshToken(
  userId: number,
  secret: string
): Promise<string> {
  const secretKey = getSecretKey(secret);

  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secretKey);
}

export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const secretKey = getSecretKey(secret);

  const { payload } = await jwtVerify(token, secretKey);

  return {
    sub: payload.sub as number,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as "admin" | "editor",
  };
}

export async function verifyRefreshToken(
  token: string,
  secret: string
): Promise<{ sub: number }> {
  const secretKey = getSecretKey(secret);

  const { payload } = await jwtVerify(token, secretKey);

  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  return { sub: payload.sub as number };
}

export function generateInviteToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Calculate expiry date for invite tokens (48 hours)
export function getInviteExpiry(): string {
  const date = new Date();
  date.setHours(date.getHours() + 48);
  return date.toISOString();
}

// Calculate expiry date for refresh tokens (7 days)
export function getRefreshTokenExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
