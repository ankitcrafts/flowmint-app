/**
 * FlowMint Native Crypto Engine
 * Uses the Web Cryptography API to encrypt and decrypt sensitive user data (like Aadhaar/PAN details)
 * locally on the device without sending it to any 3rd-party KYC providers.
 */

// Helper: Convert ArrayBuffer or Uint8Array to Base64 String
const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Convert Base64 String to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

/**
 * Generates a strong AES-GCM 256-bit symmetric key that acts as the "Biometric Key"
 */
export const generateBiometricKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Key is extractable (for demo persistance)
    ['encrypt', 'decrypt']
  );
};

/**
 * Export a CryptoKey to a Base64 encoded JSON Web Key (JWK) string
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  return btoa(JSON.stringify(jwk));
};

/**
 * Import a Base64 encoded JWK string back into a CryptoKey
 */
export const importKey = async (base64Jwk: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(atob(base64Jwk));
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

export interface EncryptedPayload {
  iv: string;         // Initialization Vector (Base64)
  ciphertext: string; // Encrypted Data Blob (Base64)
}

/**
 * Encrypt a standard string (like a JSON payload) with the biometric key
 */
export const encryptDeviceData = async (
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> => {
  const ec = new TextEncoder();
  
  // AES-GCM requires a unique IV for every encryption call
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ec.encode(plaintext)
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
  };
};

/**
 * Decrypt a specific ciphertext string back into its original text using the biometric key
 */
export const decryptDeviceData = async (
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> => {
  const ivBuffer = base64ToBuffer(payload.iv);
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
};
