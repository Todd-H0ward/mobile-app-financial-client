import Constants from 'expo-constants';

/** From `expo.version` in app.json — single bump for native + settings. */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
