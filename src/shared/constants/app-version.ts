import Constants from 'expo-constants';

/** App version, sourced from `expo.version` in app.json — the single place
 *  to bump it (native builds and the settings screen both read from there). */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
