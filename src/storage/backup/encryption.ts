const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const DEFAULT_PBKDF2_ITERATIONS = 600_000;

export function utf8ToBytes(value: string) {
  return encoder.encode(value);
}

export function bytesToUtf8(value: ArrayBuffer) {
  return decoder.decode(value);
}

export function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function deriveAesGcmKey(params: {
  password: string;
  salt: Uint8Array;
  iterations: number;
}) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(params.password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: params.salt,
      iterations: params.iterations,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBytes(params: {
  bytes: Uint8Array;
  password: string;
  salt: Uint8Array;
  iv: Uint8Array;
  iterations: number;
}) {
  const key = await deriveAesGcmKey({
    password: params.password,
    salt: params.salt,
    iterations: params.iterations
  });

  return crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: params.iv
    },
    key,
    params.bytes
  );
}

export async function decryptBytes(params: {
  encryptedBytes: Uint8Array;
  password: string;
  salt: Uint8Array;
  iv: Uint8Array;
  iterations: number;
}) {
  const key = await deriveAesGcmKey({
    password: params.password,
    salt: params.salt,
    iterations: params.iterations
  });

  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: params.iv
    },
    key,
    params.encryptedBytes
  );
}

export async function sha256Base64(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64(new Uint8Array(digest));
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
