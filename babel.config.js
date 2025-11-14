module.exports = function (api) {
  api.cache(true);
  const isWeb = process.env.EXPO_TARGET === 'web';
  return {
    presets: ['babel-preset-expo'],
    // Disable Reanimated plugin on web to avoid missing 'react-native-worklets' plugin
    plugins: isWeb ? [] : ['react-native-reanimated/plugin'],
  };
};