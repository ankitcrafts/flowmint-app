package com.flowmint.app;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executors;

@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {

    private static final String TAG = "GoogleAuthPlugin";

    @PluginMethod
    public void signIn(PluginCall call) {
        String clientId = call.getString("clientId", "");

        if (clientId == null || clientId.isEmpty()) {
            call.reject("clientId is required");
            return;
        }

        try {
            CredentialManager credentialManager = CredentialManager.create(getContext());

            GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(clientId)
                    .setAutoSelectEnabled(false)
                    .build();

            GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build();

            credentialManager.getCredentialAsync(
                    getActivity(),
                    request,
                    null, // cancellationSignal
                    Executors.newSingleThreadExecutor(),
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse result) {
                            handleSignInResult(result, call);
                        }

                        @Override
                        public void onError(@NonNull GetCredentialException e) {
                            Log.e(TAG, "Google Sign-In failed", e);
                            call.reject("Google Sign-In failed: " + e.getMessage(), e.getType());
                        }
                    }
            );
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Google Sign-In", e);
            call.reject("Error initializing Google Sign-In: " + e.getMessage());
        }
    }

    private void handleSignInResult(GetCredentialResponse response, PluginCall call) {
        Credential credential = response.getCredential();

        if (credential instanceof CustomCredential) {
            if (GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                try {
                    GoogleIdTokenCredential googleIdTokenCredential =
                            GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());

                    JSObject result = new JSObject();
                    result.put("idToken", googleIdTokenCredential.getIdToken());
                    result.put("email", googleIdTokenCredential.getId());
                    result.put("displayName", googleIdTokenCredential.getDisplayName());
                    
                    String photoUrl = googleIdTokenCredential.getProfilePictureUri() != null
                            ? googleIdTokenCredential.getProfilePictureUri().toString()
                            : null;
                    result.put("photoUrl", photoUrl);

                    call.resolve(result);
                } catch (Exception e) {
                    Log.e(TAG, "Error parsing Google credential", e);
                    call.reject("Error parsing Google credential: " + e.getMessage());
                }
            } else {
                call.reject("Unexpected credential type: " + credential.getType());
            }
        } else {
            call.reject("Unexpected credential type");
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            CredentialManager credentialManager = CredentialManager.create(getContext());
            ClearCredentialStateRequest request = new ClearCredentialStateRequest();
            
            credentialManager.clearCredentialStateAsync(
                    request,
                    null, // cancellationSignal
                    Executors.newSingleThreadExecutor(),
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void unused) {
                            call.resolve();
                        }

                        @Override
                        public void onError(@NonNull ClearCredentialException e) {
                            Log.e(TAG, "Sign out failed", e);
                            call.reject("Sign out failed: " + e.getMessage());
                        }
                    }
            );
        } catch (Exception e) {
            Log.e(TAG, "Error during sign out", e);
            call.reject("Error during sign out: " + e.getMessage());
        }
    }
}
