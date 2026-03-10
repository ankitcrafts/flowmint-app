import { registerPlugin } from '@capacitor/core';

/**
 * FlowMint Biometric Authentication Plugin
 * 
 * Bridges to native Android BiometricPrompt / iOS LAContext
 * for hardware-level biometric verification.
 * 
 * Security Architecture:
 * - Uses Android KeyStore / iOS Secure Enclave for key storage
 * - Keys are bound to biometric authentication
 * - Detects invalidated keys when biometrics change on device
 * - Never stores or transmits raw biometric data
 */

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'iris' | 'none';
  hasEnrolledBiometrics: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  signature?: string;       // Base64 encoded cryptographic signature
  keyReference?: string;    // SHA-256 hash of the public key
  timestamp: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface BiometricKeyStatus {
  exists: boolean;
  isValid: boolean;         // false if biometrics changed on device
  keyReference?: string;
}

export interface BiometricAuthPlugin {
  /**
   * Check if biometric hardware is available and configured
   */
  checkAvailability(): Promise<BiometricAvailability>;

  /**
   * Trigger native biometric prompt for authentication
   * On Android: Uses BiometricPrompt with CryptoObject
   * On iOS: Uses LAContext with SecKey
   */
  authenticate(options: {
    title?: string;
    subtitle?: string;
    description?: string;
    negativeButtonText?: string;
    keyAlias?: string;
  }): Promise<BiometricAuthResult>;

  /**
   * Generate a new cryptographic key pair bound to biometric auth
   * Key is stored in Android KeyStore / iOS Secure Enclave
   */
  generateBiometricKey(options: {
    keyAlias: string;
  }): Promise<{ keyReference: string; success: boolean }>;

  /**
   * Check if a biometric-bound key exists and is still valid
   * Returns invalid if device biometrics have changed
   */
  checkKeyStatus(options: {
    keyAlias: string;
  }): Promise<BiometricKeyStatus>;

  /**
   * Delete a biometric-bound key (for re-enrollment)
   */
  deleteKey(options: {
    keyAlias: string;
  }): Promise<{ success: boolean }>;

  /**
   * Listen for failed biometric attempt events natively
   */
  addListener(
    eventName: 'onBiometricFailure',
    listenerFunc: (info: { event: string }) => void
  ): Promise<any>;
}

// Register the plugin — on web, falls back to WebAuthn/Web Crypto
const BiometricAuth = registerPlugin<BiometricAuthPlugin>('BiometricAuth', {
  web: () => import('./BiometricAuthWeb').then(m => new m.BiometricAuthWeb()),
});

export default BiometricAuth;
