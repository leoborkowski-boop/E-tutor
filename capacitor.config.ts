import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.edukwadrat.app',
  appName: 'EduKwadrat',
  webDir: 'dist',
  android: {
    // kolor tła WebView przed załadowaniem strony (jak tło aplikacji)
    backgroundColor: '#f6f6f3',
  },
};

export default config;
