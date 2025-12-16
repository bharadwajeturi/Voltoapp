module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 🟢 THIS LINE IS REQUIRED FOR BOTTOM SHEET TO WORK
      'react-native-reanimated/plugin',
    ],
  };
};