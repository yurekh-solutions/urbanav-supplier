const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.sourceExts.push('cjs');

module.exports = config;
