const { withGradleProperties } = require('expo/config-plugins');

/**
 * Релизный APK собирается только под ARM: x86/x86_64 нужны эмулятору, а не
 * телефону, и стоят половины времени сборки и нескольких гигабайт на диске.
 * Для эмулятора есть отладочная сборка (`npm run run:android`), где prebuild
 * оставляет все четыре ABI, — свойство читается только релизным скриптом.
 */

const KEY = 'reactNativeArchitectures';
const RELEASE_ABIS = 'armeabi-v7a,arm64-v8a';

module.exports = (config) =>
  withGradleProperties(config, (cfg) => {
    if (process.env.ANDROID_RELEASE_ABIS_ALL === '1') return cfg;

    cfg.modResults = cfg.modResults.map((item) =>
      item.type === 'property' && item.key === KEY ? { ...item, value: RELEASE_ABIS } : item,
    );

    return cfg;
  });
