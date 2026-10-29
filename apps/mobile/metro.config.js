const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Resolve redirects for RN 0.74+ / Expo SDK compatibility
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/asset-registry') {
    try {
      const target = require.resolve('@react-native/assets-registry/registry.js', {
        paths: [projectRoot, monorepoRoot],
      });
      return {
        filePath: target,
        type: 'sourceFile',
      };
    } catch {
      // Fallback
    }
  }

  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    try {
      const target = path.resolve(monorepoRoot, 'node_modules/react-native/unstable-internals-do-not-use.js');
      return {
        filePath: target,
        type: 'sourceFile',
      };
    } catch {
      // Fallback
    }
  }

  if (moduleName === 'react-native/setup-env') {
    try {
      const target = path.resolve(monorepoRoot, 'node_modules/react-native/Libraries/Core/InitializeCore.js');
      return {
        filePath: target,
        type: 'sourceFile',
      };
    } catch {
      // Fallback
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
