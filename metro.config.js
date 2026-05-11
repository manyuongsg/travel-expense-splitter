const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit workers on Windows to avoid EBUSY file-locking errors
if (process.platform === 'win32') {
  config.maxWorkers = 1;
}

module.exports = config;
