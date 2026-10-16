export type FlowMintAuthMethod = 'email_otp' | 'google';

const AUTH_METHOD_STORAGE_KEY = 'flowmint_auth_method';
const GOOGLE_OAUTH_PENDING_STORAGE_KEY = 'flowmint_google_oauth_pending';

export const getStoredAuthMethod = (): FlowMintAuthMethod | null => {
  const method = window.localStorage.getItem(AUTH_METHOD_STORAGE_KEY);
  return method === 'email_otp' || method === 'google' ? method : null;
};

export const setStoredAuthMethod = (method: FlowMintAuthMethod): void => {
  window.localStorage.setItem(AUTH_METHOD_STORAGE_KEY, method);
};

export const clearStoredAuthMethod = (): void => {
  window.localStorage.removeItem(AUTH_METHOD_STORAGE_KEY);
  clearGoogleOAuthPending();
};

export const isGoogleOAuthPending = (): boolean =>
  window.localStorage.getItem(GOOGLE_OAUTH_PENDING_STORAGE_KEY) === 'true';

export const setGoogleOAuthPending = (): void => {
  window.localStorage.setItem(GOOGLE_OAUTH_PENDING_STORAGE_KEY, 'true');
};

export const clearGoogleOAuthPending = (): void => {
  window.localStorage.removeItem(GOOGLE_OAUTH_PENDING_STORAGE_KEY);
};
