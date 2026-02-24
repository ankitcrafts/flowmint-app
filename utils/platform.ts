/**
 * Platform Detection Utilities
 * 
 * Detects whether the app is running inside a native Capacitor shell (APK/IPA)
 * or in a standard web browser. This distinction is critical because:
 * 
 *   - Capacitor JS sets `window.Capacitor` even in the browser (when the npm
 *     package is installed), so checking `!!window.Capacitor` is NOT reliable.
 *   - `Capacitor.isNativePlatform()` returns true ONLY inside a real native app.
 * 
 * Usage:
 *   import { isNativeApp, getPlatform } from '../utils/platform';
 *   if (isNativeApp()) { ... } // Only true in APK/IPA
 */

/** Returns true ONLY when running inside a native Capacitor app (Android/iOS) */
export const isNativeApp = (): boolean => {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

/** Returns the current platform: 'android', 'ios', or 'web' */
export const getPlatform = (): 'android' | 'ios' | 'web' => {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      return cap.getPlatform?.() || 'web';
    }
  } catch {}
  return 'web';
};

/**
 * Returns the API base URL based on the platform.
 * - Web browser: empty string (Vite proxy handles /api/* → localhost:3000)
 * - Native app: deployed server URL (no Vite proxy available in APK)
 */
export const getApiBase = (): string => {
  if (isNativeApp()) {
    return (import.meta as any).env?.VITE_API_SERVER_URL || 'https://flowmint-app.onrender.com';
  }
  return '';
};
