import type {
  BiometricAuthPlugin,
  BiometricAvailability,
  BiometricAuthResult,
  BiometricKeyStatus,
} from './BiometricAuth';

/**
 * Web fallback for BiometricAuth plugin.
 * Uses Web Crypto API for key generation and WebAuthn where available.
 * On desktop browsers, simulates biometric with device-bound crypto keys.
 */
export class BiometricAuthWeb implements BiometricAuthPlugin {

  async checkAvailability(): Promise<BiometricAvailability> {
    // Check for WebAuthn support (modern browsers)
    const webAuthnAvailable = !!(window.PublicKeyCredential);

    // Check for Web Crypto (needed for key operations)
    const cryptoAvailable = !!(window.crypto?.subtle);

    // Check if platform authenticator (fingerprint/Face) is available
    let hasPlatformAuth = false;
    if (webAuthnAvailable) {
      try {
        hasPlatformAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch { hasPlatformAuth = false; }
    }

    return {
      isAvailable: cryptoAvailable,
      biometryType: hasPlatformAuth ? 'fingerprint' : 'none',
      hasEnrolledBiometrics: hasPlatformAuth || cryptoAvailable,
    };
  }

  async authenticate(options: {
    title?: string;
    subtitle?: string;
    description?: string;
    negativeButtonText?: string;
    keyAlias?: string;
  }): Promise<BiometricAuthResult> {
    const alias = options.keyAlias || 'flowmint_bio_default';
    const timestamp = Date.now();

    try {
      // Try WebAuthn platform authenticator first (real biometric on device)
      const webAuthnAvailable = !!(window.PublicKeyCredential);
      let hasPlatformAuth = false;

      if (webAuthnAvailable) {
        try {
          hasPlatformAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch { hasPlatformAuth = false; }
      }

      if (hasPlatformAuth) {
        return await this._webAuthnAuthenticate(alias, timestamp);
      }

      // Fallback: Use Web Crypto challenge-response with stored key
      return await this._cryptoAuthenticate(alias, timestamp);
    } catch (err: any) {
      return {
        success: false,
        timestamp,
        errorCode: 'AUTH_FAILED',
        errorMessage: err.message || 'Biometric authentication failed',
      };
    }
  }

  async generateBiometricKey(options: { keyAlias: string }): Promise<{ keyReference: string; success: boolean }> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, // Non-extractable for security
        ['sign', 'verify']
      );

      // Export public key to compute reference hash
      const publicKeyRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', publicKeyRaw);
      const keyReference = this._bufferToHex(hashBuffer);

      // Store the key pair in IndexedDB (persists across sessions)
      await this._storeKeyPair(options.keyAlias, keyPair);

      return { keyReference, success: true };
    } catch (err: any) {
      return { keyReference: '', success: false };
    }
  }

  async checkKeyStatus(options: { keyAlias: string }): Promise<BiometricKeyStatus> {
    try {
      const keyPair = await this._getKeyPair(options.keyAlias);
      if (!keyPair) {
        return { exists: false, isValid: false };
      }

      // Verify key is still usable by doing a test sign
      const testData = new TextEncoder().encode('key_validation_test');
      await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        testData
      );

      const publicKeyRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', publicKeyRaw);
      const keyReference = this._bufferToHex(hashBuffer);

      return { exists: true, isValid: true, keyReference };
    } catch {
      return { exists: true, isValid: false };
    }
  }

  async deleteKey(options: { keyAlias: string }): Promise<{ success: boolean }> {
    try {
      await this._deleteKeyPair(options.keyAlias);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async addListener(eventName: 'onBiometricFailure', listenerFunc: (info: { event: string }) => void): Promise<any> {
    // Web fallback doesn't trigger native real-time failure events 
    // It just resolves the Promise with an error, so this is a placeholder.
    return { remove: () => {} };
  }

  // --- WebAuthn Implementation ---
  private async _webAuthnAuthenticate(alias: string, timestamp: number): Promise<BiometricAuthResult> {
    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));

      // Check if we have a stored credential ID
      const storedCredId = localStorage.getItem(`flowmint_webauthn_${alias}`);

      if (!storedCredId) {
        // First time — create credential (registration)
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'FlowMint', id: window.location.hostname },
            user: {
              id: new TextEncoder().encode(alias),
              name: 'FlowMint User',
              displayName: 'FlowMint User',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        }) as PublicKeyCredential;

        if (credential) {
          localStorage.setItem(
            `flowmint_webauthn_${alias}`,
            this._bufferToBase64(credential.rawId)
          );
          return { success: true, timestamp, keyReference: credential.id };
        }
      } else {
        // Returning user — verify with existing credential
        const credentialId = this._base64ToBuffer(storedCredId);
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{
              id: credentialId,
              type: 'public-key',
              transports: ['internal'],
            }],
            userVerification: 'required',
            timeout: 60000,
          },
        }) as PublicKeyCredential;

        if (assertion) {
          return { success: true, timestamp, keyReference: assertion.id };
        }
      }

      return { success: false, timestamp, errorCode: 'NO_CREDENTIAL', errorMessage: 'No credential returned' };
    } catch (err: any) {
      // WebAuthn failed, fall back to crypto
      return this._cryptoAuthenticate(alias, timestamp);
    }
  }

  // --- Web Crypto Fallback ---
  private async _cryptoAuthenticate(alias: string, timestamp: number): Promise<BiometricAuthResult> {
    try {
      let keyPair = await this._getKeyPair(alias);

      if (!keyPair) {
        // Auto-generate key on first use
        const genResult = await this.generateBiometricKey({ keyAlias: alias });
        if (!genResult.success) {
          return { success: false, timestamp, errorCode: 'KEY_GEN_FAILED', errorMessage: 'Failed to generate key' };
        }
        keyPair = await this._getKeyPair(alias);
      }

      if (!keyPair) {
        return { success: false, timestamp, errorCode: 'NO_KEY', errorMessage: 'Key not found' };
      }

      // Sign a challenge to prove key possession
      const challengeData = new TextEncoder().encode(`flowmint_auth_${timestamp}_${alias}`);
      const signature = await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        challengeData
      );

      const publicKeyRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', publicKeyRaw);
      const keyReference = this._bufferToHex(hashBuffer);

      return {
        success: true,
        signature: this._bufferToBase64(signature),
        keyReference,
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        timestamp,
        errorCode: 'CRYPTO_FAILED',
        errorMessage: err.message || 'Crypto authentication failed',
      };
    }
  }

  // --- IndexedDB Key Storage ---
  private _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FlowMintBiometricKeys', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async _storeKeyPair(alias: string, keyPair: CryptoKeyPair): Promise<void> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').put(keyPair, alias);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async _getKeyPair(alias: string): Promise<CryptoKeyPair | null> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readonly');
      const req = tx.objectStore('keys').get(alias);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  private async _deleteKeyPair(alias: string): Promise<void> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').delete(alias);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Helpers ---
  private _bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private _bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private _base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer as ArrayBuffer;
  }
}
