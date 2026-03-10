import BiometricAuth from '../plugins/BiometricAuth';
import { supabase } from './supabase';
import { getPlatform } from '../utils/platform';

export class BiometricService {
  /**
   * Check if biometric authentication is available on the device
   */
  static async checkDeviceAvailability() {
    return await BiometricAuth.checkAvailability();
  }

  /**
   * Check if the user has enrolled biometrics in our DB
   * and if their device key is still valid
   */
  static async checkUserEnrollment(userId: string) {
    try {
      // 1. Get user enrollment from DB
      const { data: dbRecord, error } = await supabase
        .from('user_biometrics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !dbRecord || !dbRecord.biometric_enabled) {
        return { isEnrolled: false };
      }

      if (dbRecord.is_invalidated) {
        return { isEnrolled: true, isInvalidated: true, record: dbRecord };
      }

      // 2. Check if the cryptographic key still exists and is valid on device
      const keyAlias = `flowmint_bio_${userId}`;
      const keyStatus = await BiometricAuth.checkKeyStatus({ keyAlias });

      if (!keyStatus.exists || !keyStatus.isValid) {
        // Biometrics changed on device or key was cleared
        // Mark as invalidated in DB
        await this.invalidateEnrollment(userId);
        return { isEnrolled: true, isInvalidated: true, record: dbRecord };
      }

      // 3. Ensure the key reference matches what we expect
      if (dbRecord.biometric_key_reference && keyStatus.keyReference !== dbRecord.biometric_key_reference) {
         await this.invalidateEnrollment(userId);
         return { isEnrolled: true, isInvalidated: true, record: dbRecord };
      }

      return { isEnrolled: true, isInvalidated: false, record: dbRecord };
    } catch (e) {
      console.error('Failed to check user enrollment:', e);
      return { isEnrolled: false };
    }
  }

  /**
   * Enroll a new biometric credential for the user
   */
  static async enrollBiometrics(userId: string) {
    const keyAlias = `flowmint_bio_${userId}`;

    // 1. Generate new hardware-bound key (may prompt user depending on platform OS)
    const genResult = await BiometricAuth.generateBiometricKey({ keyAlias });
    if (!genResult.success) {
      throw new Error('FAILED_KEY_GENERATION');
    }

    // 2. Prompt user to authenticate immediately to prove possession/intent
    const authResult = await BiometricAuth.authenticate({
      title: 'Setup Biometrics',
      subtitle: 'Link your identity securely',
      description: 'Scan to enable fast login for FlowMint.',
      keyAlias
    });

    if (!authResult.success) {
       // Cleanup key if auth fails
       await BiometricAuth.deleteKey({ keyAlias });
       throw new Error(authResult.errorCode || 'AUTH_FAILED');
    }

    // 3. Get device ID
    const deviceId = await this.getDeviceId();

    // 4. Update DB
    const payload = {
      user_id: userId,
      biometric_enabled: true,
      device_id: deviceId,
      biometric_key_reference: genResult.keyReference,
      platform: getPlatform(),
      enrolled_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      is_invalidated: false,
    };

    const { error } = await supabase
      .from('user_biometrics')
      .upsert(payload, { onConflict: 'user_id,device_id' });

    if (error) {
       await BiometricAuth.deleteKey({ keyAlias });
       throw new Error('DB_UPDATE_FAILED');
    }

    return true;
  }

  /**
   * Verify an existing biometric enrollment
   */
  static async verifyBiometrics(userId: string) {
    const keyAlias = `flowmint_bio_${userId}`;

    // 1. Prompt hardware authentication
    const authResult = await BiometricAuth.authenticate({
      title: 'FlowMint Login',
      subtitle: 'Verify to access your Dashboard',
      keyAlias
    });

    if (!authResult.success) {
      throw new Error(authResult.errorCode || 'AUTH_FAILED');
    }

    // 2. Optionally, backend could verify `authResult.signature` here
    // For this client implementation, we trust the secure hardware module success
    // Let's update the last verified timestamp
    try {
      const deviceId = await this.getDeviceId();
      await supabase
        .from('user_biometrics')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
    } catch (e) {
       console.warn('Silent timestamp update failed', e);
    }

    return true;
  }

  /**
   * Invalidate biometric enrollment (if changed on device)
   */
  static async invalidateEnrollment(userId: string) {
     const deviceId = await this.getDeviceId();
     await supabase
        .from('user_biometrics')
        .update({ is_invalidated: true, biometric_enabled: false })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
  }

  /**
   * Utility to get a consistent device ID.
   * In a real app, use @capacitor/device plugin.
   * Using localStorage fallback here.
   */
  private static async getDeviceId(): Promise<string> {
    let devId = localStorage.getItem('flowmint_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('flowmint_device_id', devId);
    }
    return devId;
  }
}
