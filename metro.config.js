const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// glb is not in Expo's default assetExts — without it Metro treats the file
// as a JS module and the home screen dies with UnableToResolveError.
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter((ext) => !['glb', 'wasm'].includes(ext)),
  'glb',
  'wasm',
];
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !['glb', 'wasm'].includes(ext),
);

// SQLite's synchronous web worker requires cross-origin isolation.
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (request, response, next) => {
    response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhanced(request, response, next);
  };
};

module.exports = config;
