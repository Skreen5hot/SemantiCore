/**
 * Deterministic Canonicalization
 *
 * Provides stable serialization of JSON values by recursively sorting
 * object keys and optionally sorting unordered arrays. This ensures
 * that identical data structures produce identical string representations
 * regardless of property insertion order.
 *
 * This module is part of the kernel and MUST NOT perform I/O or
 * reference non-deterministic APIs.
 */

/**
 * Recursively canonicalize a value by sorting object keys.
 * Arrays are preserved in their original order (caller is responsible
 * for ensuring semantic ordering if needed).
 *
 * @param value - Any JSON-serializable value
 * @returns A new value with all object keys sorted recursively
 */
export function canonicalizeJson(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }

  // Plain object: sort keys lexicographically
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of keys) {
    sorted[key] = canonicalizeJson(obj[key]);
  }
  return sorted;
}

/**
 * Produce a deterministic JSON string from any JSON-serializable value.
 *
 * Object keys are sorted recursively. Arrays preserve element order.
 * The output is suitable for deterministic comparison and hashing.
 *
 * @param value - Any JSON-serializable value
 * @param pretty - If true, output is indented with 2 spaces (default: false)
 * @returns A deterministic JSON string
 */
export function stableStringify(value: unknown, pretty: boolean = false): string {
  const canonical = canonicalizeJson(value);
  return pretty
    ? JSON.stringify(canonical, null, 2)
    : JSON.stringify(canonical);
}

export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(stableStringify(value));
}

export function canonicalContentHash(value: unknown): string {
  return `sha256:${sha256Hex(canonicalBytes(value))}`;
}

export function sha256Hex(bytes: Uint8Array): string {
  const hash = sha256(bytes);
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const SHA256_INITIAL_STATE = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19,
];

const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(input: Uint8Array): Uint8Array {
  const padded = padSha256Input(input);
  const hash = [...SHA256_INITIAL_STATE];
  const words = new Array<number>(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index++) {
      const byteOffset = offset + index * 4;
      words[index] =
        (padded[byteOffset] << 24) |
        (padded[byteOffset + 1] << 16) |
        (padded[byteOffset + 2] << 8) |
        padded[byteOffset + 3];
    }
    for (let index = 16; index < 64; index++) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = add32(words[index - 16], s0, words[index - 7], s1);
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = add32(h, s1, choice, SHA256_ROUND_CONSTANTS[index], words[index]);
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add32(s0, majority);
      h = g;
      g = f;
      f = e;
      e = add32(d, temp1);
      d = c;
      c = b;
      b = a;
      a = add32(temp1, temp2);
    }

    hash[0] = add32(hash[0], a);
    hash[1] = add32(hash[1], b);
    hash[2] = add32(hash[2], c);
    hash[3] = add32(hash[3], d);
    hash[4] = add32(hash[4], e);
    hash[5] = add32(hash[5], f);
    hash[6] = add32(hash[6], g);
    hash[7] = add32(hash[7], h);
  }

  const output = new Uint8Array(32);
  hash.forEach((word, index) => {
    output[index * 4] = word >>> 24;
    output[index * 4 + 1] = word >>> 16;
    output[index * 4 + 2] = word >>> 8;
    output[index * 4 + 3] = word;
  });
  return output;
}

function padSha256Input(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  return padded;
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function add32(...values: number[]): number {
  return values.reduce((sum, value) => (sum + value) >>> 0, 0);
}
