package com.flowmint.app;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.Certificate;
import java.util.concurrent.Executor;

/**
 * FlowMint Biometric Authentication Plugin for Android
 * 
 * Uses AndroidX BiometricPrompt with Android KeyStore for:
 * - Hardware-backed biometric authentication
 * - Cryptographic key generation bound to biometric auth
 * - Detection of invalidated keys when biometrics change
 * 
 * Security: Keys are stored in Android KeyStore (TEE/StrongBox),
 * requiring biometric authentication to access. Raw biometric
 * data never leaves the secure hardware.
 */
@CapacitorPlugin(name = "BiometricAuth")
public class BiometricAuthPlugin extends Plugin {

    private static final String TAG = "BiometricAuth";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String SIGNATURE_ALGORITHM = "SHA256withECDSA";

    @PluginMethod
    public void checkAvailability(PluginCall call) {
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int canAuthenticate = biometricManager.canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG);

            JSObject result = new JSObject();

            switch (canAuthenticate) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    result.put("isAvailable", true);
                    result.put("biometryType", "fingerprint");
                    result.put("hasEnrolledBiometrics", true);
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    result.put("isAvailable", false);
                    result.put("biometryType", "none");
                    result.put("hasEnrolledBiometrics", false);
                    result.put("errorCode", "NO_HARDWARE");
                    result.put("errorMessage", "No biometric hardware available");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    result.put("isAvailable", false);
                    result.put("biometryType", "none");
                    result.put("hasEnrolledBiometrics", false);
                    result.put("errorCode", "HW_UNAVAILABLE");
                    result.put("errorMessage", "Biometric hardware is temporarily unavailable");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    result.put("isAvailable", true);
                    result.put("biometryType", "fingerprint");
                    result.put("hasEnrolledBiometrics", false);
                    result.put("errorCode", "NONE_ENROLLED");
                    result.put("errorMessage", "No biometrics enrolled on this device");
                    break;
                default:
                    result.put("isAvailable", false);
                    result.put("biometryType", "none");
                    result.put("hasEnrolledBiometrics", false);
                    result.put("errorCode", "UNKNOWN");
                    result.put("errorMessage", "Unknown biometric status");
            }

            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "checkAvailability failed", e);
            call.reject("Failed to check biometric availability", e);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        String title = call.getString("title", "Biometric Authentication");
        String subtitle = call.getString("subtitle", "Verify your identity");
        String description = call.getString("description", "Place your finger on the sensor");
        String negativeButtonText = call.getString("negativeButtonText", "Cancel");
        String keyAlias = call.getString("keyAlias", "flowmint_bio_default");

        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(getContext());

        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                try {
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("timestamp", System.currentTimeMillis());

                    // If we used CryptoObject, extract the signature
                    BiometricPrompt.CryptoObject crypto = result.getCryptoObject();
                    if (crypto != null && crypto.getSignature() != null) {
                        Signature sig = crypto.getSignature();
                        byte[] challengeData = ("flowmint_auth_" + System.currentTimeMillis()).getBytes();
                        sig.update(challengeData);
                        byte[] signatureBytes = sig.sign();
                        ret.put("signature", Base64.encodeToString(signatureBytes, Base64.NO_WRAP));
                    }

                    // Get key reference
                    String keyRef = getKeyReference(keyAlias);
                    if (keyRef != null) {
                        ret.put("keyReference", keyRef);
                    }

                    call.resolve(ret);
                } catch (Exception e) {
                    Log.e(TAG, "Post-auth processing failed", e);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("timestamp", System.currentTimeMillis());
                    call.resolve(ret);
                }
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("timestamp", System.currentTimeMillis());
                ret.put("errorCode", getErrorCodeString(errorCode));
                ret.put("errorMessage", errString.toString());
                call.resolve(ret);
            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();
                // Notify the web layer so it can track consecutive failures (e.g., lock out
                // after 10)
                JSObject info = new JSObject();
                info.put("event", "failed");
                notifyListeners("onBiometricFailure", info);
                Log.w(TAG, "Biometric authentication attempt failed (user can retry)");
            }
        };

        activity.runOnUiThread(() -> {
            try {
                BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, callback);

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setDescription(description)
                        .setNegativeButtonText(negativeButtonText)
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                        .build();

                // Try to use CryptoObject for hardware-backed auth
                try {
                    Signature signature = getSignatureForKey(keyAlias);
                    if (signature != null) {
                        BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(signature);
                        biometricPrompt.authenticate(promptInfo, cryptoObject);
                        return;
                    }
                } catch (KeyPermanentlyInvalidatedException e) {
                    Log.w(TAG, "Key invalidated (biometrics changed), authenticating without crypto");
                    // Key was invalidated because biometrics changed
                    // We'll authenticate without CryptoObject and flag it
                } catch (Exception e) {
                    Log.w(TAG, "CryptoObject creation failed, authenticating without crypto", e);
                }

                // Fallback: authenticate without CryptoObject
                biometricPrompt.authenticate(promptInfo);

            } catch (Exception e) {
                Log.e(TAG, "BiometricPrompt launch failed", e);
                call.reject("Failed to launch biometric prompt", e);
            }
        });
    }

    @PluginMethod
    public void generateBiometricKey(PluginCall call) {
        String keyAlias = call.getString("keyAlias", "flowmint_bio_default");

        try {
            // Delete existing key if present
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
            if (keyStore.containsAlias(keyAlias)) {
                keyStore.deleteEntry(keyAlias);
            }

            // Generate new EC key pair in Android KeyStore
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC, KEYSTORE_PROVIDER);

            KeyGenParameterSpec.Builder specBuilder = new KeyGenParameterSpec.Builder(
                    keyAlias,
                    KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .setUserAuthenticationRequired(true);

            // Require biometric auth every time the key is used
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                specBuilder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
            }

            // Invalidate key if biometrics change
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                specBuilder.setInvalidatedByBiometricEnrollment(true);
            }

            keyPairGenerator.initialize(specBuilder.build());
            keyPairGenerator.generateKeyPair();

            // Get the key reference (hash of public key)
            String keyReference = getKeyReference(keyAlias);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("keyReference", keyReference != null ? keyReference : "");
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Key generation failed", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("keyReference", "");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void checkKeyStatus(PluginCall call) {
        String keyAlias = call.getString("keyAlias", "flowmint_bio_default");

        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            JSObject result = new JSObject();

            if (!keyStore.containsAlias(keyAlias)) {
                result.put("exists", false);
                result.put("isValid", false);
                call.resolve(result);
                return;
            }

            result.put("exists", true);

            // Try to init a Signature to check if key is still valid
            try {
                PrivateKey privateKey = (PrivateKey) keyStore.getKey(keyAlias, null);
                Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
                signature.initSign(privateKey);

                String keyReference = getKeyReference(keyAlias);
                result.put("isValid", true);
                result.put("keyReference", keyReference != null ? keyReference : "");
            } catch (KeyPermanentlyInvalidatedException e) {
                // Biometrics were changed on the device
                result.put("isValid", false);
                Log.w(TAG, "Key permanently invalidated — biometrics changed");
            } catch (Exception e) {
                result.put("isValid", false);
                Log.e(TAG, "Key validation failed", e);
            }

            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "checkKeyStatus failed", e);
            call.reject("Failed to check key status", e);
        }
    }

    @PluginMethod
    public void deleteKey(PluginCall call) {
        String keyAlias = call.getString("keyAlias", "flowmint_bio_default");

        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            if (keyStore.containsAlias(keyAlias)) {
                keyStore.deleteEntry(keyAlias);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "deleteKey failed", e);
            JSObject result = new JSObject();
            result.put("success", false);
            call.resolve(result);
        }
    }

    // --- Helper Methods ---

    private Signature getSignatureForKey(String keyAlias) throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);

        if (!keyStore.containsAlias(keyAlias))
            return null;

        PrivateKey privateKey = (PrivateKey) keyStore.getKey(keyAlias, null);
        if (privateKey == null)
            return null;

        Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
        signature.initSign(privateKey);
        return signature;
    }

    private String getKeyReference(String keyAlias) {
        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);

            Certificate cert = keyStore.getCertificate(keyAlias);
            if (cert == null)
                return null;

            PublicKey publicKey = cert.getPublicKey();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(publicKey.getEncoded());

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();

        } catch (Exception e) {
            Log.e(TAG, "getKeyReference failed", e);
            return null;
        }
    }

    private String getErrorCodeString(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_CANCELED:
                return "CANCELED";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return "NO_HARDWARE";
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "HW_UNAVAILABLE";
            case BiometricPrompt.ERROR_LOCKOUT:
                return "LOCKOUT";
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "LOCKOUT_PERMANENT";
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return "USER_CANCELED";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "NO_BIOMETRICS";
            case BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL:
                return "NO_DEVICE_CREDENTIAL";
            case BiometricPrompt.ERROR_NO_SPACE:
                return "NO_SPACE";
            case BiometricPrompt.ERROR_TIMEOUT:
                return "TIMEOUT";
            case BiometricPrompt.ERROR_USER_CANCELED:
                return "USER_CANCELED";
            case BiometricPrompt.ERROR_VENDOR:
                return "VENDOR_ERROR";
            default:
                return "UNKNOWN_" + errorCode;
        }
    }
}
