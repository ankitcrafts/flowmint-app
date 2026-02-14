import { registerPlugin } from '@capacitor/core';

export interface GoogleAuthResult {
  idToken: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
}

export interface GoogleAuthPlugin {
  signIn(options: { clientId: string }): Promise<GoogleAuthResult>;
  signOut(): Promise<void>;
}

// Register the plugin — on web, it will be undefined (we use GSI instead)
const GoogleAuth = registerPlugin<GoogleAuthPlugin>('GoogleAuth');

export default GoogleAuth;
