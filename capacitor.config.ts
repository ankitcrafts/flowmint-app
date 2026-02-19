import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowmint.app',
  appName: 'FlowMint',
  webDir: 'dist',
  server: {
    // Allow all mixed content and navigation for API calls
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
