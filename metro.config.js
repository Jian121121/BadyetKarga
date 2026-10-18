const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports a .wasm file; the web build uses a localStorage mock, so it only needs to resolve.
config.resolver.assetExts.push('wasm');

module.exports = config;
