const { createRequire } = require('module');
const path = require('path');

// Resolve @expo/metro-config from the parent directory's node_modules
// because it is hoisted there and not present in delivery-app/node_modules
const parentPackageJson = path.resolve(__dirname, '..', 'package.json');
const requireParent = createRequire(parentPackageJson);

const { getDefaultConfig } = requireParent('@expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure we only watch the delivery-app directory + parent node_modules
config.watchFolders = [
    projectRoot,
    path.resolve(__dirname, '..', 'node_modules')
];

module.exports = config;
