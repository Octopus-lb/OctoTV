const encoder = new TextEncoder();

export type SignedPayload = {
  sub: string;
  scope: string;
  exp: number;
  iat?: number;
  [key: string]: unknown;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (!secret) throw new Error("A signing secret is required.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Creates a compact, URL-safe, expiring token. Used for playback sessions and
 * short-lived download links so provider secrets never reach the browser.
 */
export async function signToken(
  payload: Omit<SignedPayload, "exp" | "iat"> & {
    exp?: number;
    ttlSeconds?: number;
  },
  secret: string,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const { ttlSeconds = 3600, ...rest } = payload;
  const body = {
    ...rest,
    iat: nowSeconds,
    exp: payload.exp ?? nowSeconds + ttlSeconds,
  } as SignedPayload;
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(body)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded));
  return `${encoded}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export type VerifyResult =
  | { valid: true; payload: SignedPayload }
  | { valid: false; reason: "malformed" | "signature" | "expired" };

export async function verifyToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<VerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };

  let payload: SignedPayload;
  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(parts[0]));
    payload = JSON.parse(decoded) as SignedPayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }

  if (typeof payload.exp !== "number" || typeof payload.sub !== "string") {
    return { valid: false, reason: "malformed" };
  }

  try {
    const key = await hmacKey(secret);
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(base64UrlDecode(parts[1])),
      encoder.encode(parts[0]),
    );
    if (!verified) return { valid: false, reason: "signature" };
  } catch {
    return { valid: false, reason: "signature" };
  }

  if (payload.exp * 1000 <= nowMs) return { valid: false, reason: "expired" };
  return { valid: true, payload };
}
