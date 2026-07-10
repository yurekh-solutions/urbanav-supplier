const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.sourceExts.push('cjs');

// Fix: zustand's ESM build uses `import.meta` which breaks web classic script loading.
// Force resolution to the CJS entry point via Node's require.resolve.
const origResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    try {
      const resolved = require.resolve(moduleName);
      return { type: 'sourceFile', filePath: resolved };
    } catch {
      // Fallback to default resolution if require.resolve fails
    }
  }
  if (origResolve) return origResolve(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
