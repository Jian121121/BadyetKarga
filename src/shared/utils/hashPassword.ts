import * as Crypto from 'expo-crypto';

/**
 * Hashes a plaintext password using SHA-256.
 * This is a ONE-WAY function — there is no way to reverse a hash back to the original password.
 * To verify a password later, hash the entered password again and compare the two hashes.
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plainTextPassword
  );
  return hash;
}

/**
 * Verifies a plaintext password against a previously stored hash.
 * Re-hashes the input and compares — never decrypts.
 */
export async function verifyPassword(
  plainTextPassword: string,
  storedHash: string
): Promise<boolean> {
  const inputHash = await hashPassword(plainTextPassword);
  return inputHash === storedHash;
}