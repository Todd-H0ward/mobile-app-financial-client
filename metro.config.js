const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// glb is not in Expo's default assetExts — without it Metro treats the file
// as a JS module and the home screen dies with UnableToResolveError.
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter((ext) => ext !== 'glb'),
  'glb',
];
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'glb',
);

module.exports = config;
