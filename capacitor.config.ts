import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tenacare.nahomerTech',
  appName: 'TenaCare',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_INSIDE",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
