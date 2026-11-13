// Shim for React Native asset-registry across RN 0.88+ / Expo SDK 58
// Ensures registerAsset and getAssetByID are properly exported both as named and default exports

let actualRegistry;
try {
  actualRegistry = require('@react-native/assets-registry/registry.js');
} catch {
  try {
    actualRegistry = require('@react-native/assets-registry/registry');
  } catch {
    actualRegistry = {};
  }
}

const registerAsset =
  actualRegistry.registerAsset || actualRegistry.default?.registerAsset || ((a) => 1);
const getAssetByID =
  actualRegistry.getAssetByID || actualRegistry.default?.getAssetByID || ((id) => null);

const registry = {
  registerAsset,
  getAssetByID,
};
registry.default = registry;

module.exports = registry;
