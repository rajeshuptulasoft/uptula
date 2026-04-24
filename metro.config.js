const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: true,
      compress: {
        drop_console: true,   // removes console.log
      },
    },
  },
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'png',
      'jpg',
      'jpeg',
      'gif',
      'ttf',
      'otf',
      'svg',
      'webp',
      'bmp',
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
