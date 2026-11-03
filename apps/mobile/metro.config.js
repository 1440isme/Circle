const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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
  if (
    (moduleName === 'react-native/asset-registry' ||
      moduleName === '@react-native/assets-registry/registry' ||
      moduleName === '@react-native/assets-registry/registry.js' ||
      moduleName === 'react-native/Libraries/Image/AssetRegistry' ||
      moduleName === 'react-native/Libraries/Image/AssetRegistry.js') &&
    !context.originModulePath?.replace(/\\/g, '/').includes('src/shims/asset-registry')
  ) {
    const target = path.resolve(projectRoot, 'src/shims/asset-registry.js');
    if (fs.existsSync(target)) {
      return {
        filePath: target,
        type: 'sourceFile',
      };
    }
  }

  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    const candidatePaths = [
      path.resolve(monorepoRoot, 'node_modules/react-native/src/unstable-internals-do-not-use.js'),
      path.resolve(projectRoot, 'node_modules/react-native/src/unstable-internals-do-not-use.js'),
      path.resolve(monorepoRoot, 'node_modules/react-native/unstable-internals-do-not-use.js'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return {
          filePath: p,
          type: 'sourceFile',
        };
      }
    }
  }

  if (moduleName === 'react-native/setup-env') {
    const candidatePaths = [
      path.resolve(monorepoRoot, 'node_modules/react-native/src/setup-env.js'),
      path.resolve(projectRoot, 'node_modules/react-native/src/setup-env.js'),
      path.resolve(monorepoRoot, 'node_modules/react-native/Libraries/Core/InitializeCore.js'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return {
          filePath: p,
          type: 'sourceFile',
        };
      }
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
