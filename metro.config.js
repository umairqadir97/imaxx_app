const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .riv to asset extensions for Rive animation files
config.resolver.assetExts = [...config.resolver.assetExts, 'riv'];

module.exports = config;
